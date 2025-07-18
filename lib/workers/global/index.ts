import is from '@sindresorhus/is';
import { ERROR } from 'bunyan';
import fs from 'fs-extra';
import semver from 'semver';
import upath from 'upath';
import * as configParser from '../../config';
import { GlobalConfig } from '../../config/global';
import { resolveConfigPresets } from '../../config/presets';
import { validateConfigSecretsAndVariables } from '../../config/secrets';
import type {
  AllConfig,
  RenovateConfig,
  RenovateRepository,
} from '../../config/types';
import { CONFIG_PRESETS_INVALID } from '../../constants/error-messages';
import { pkg } from '../../expose.cjs';
import { instrument } from '../../instrumentation';
import { exportStats, finalizeReport } from '../../instrumentation/reporting';
import { getProblems, logLevel, logger, setMeta } from '../../logger';
import { setGlobalLogLevelRemaps } from '../../logger/remap';
import { getEnv } from '../../util/env';
import * as hostRules from '../../util/host-rules';
import * as queue from '../../util/http/queue';
import * as throttle from '../../util/http/throttle';
import { regexEngineStatus } from '../../util/regex';
import { addSecretForSanitizing } from '../../util/sanitize';
import * as repositoryWorker from '../repository';
import { autodiscoverRepositories } from './autodiscover';
import { parseConfigs } from './config/parse';
import { globalFinalize, globalInitialize } from './initialize';
import { isLimitReached } from './limits';

export async function getRepositoryConfig(
  globalConfig: RenovateConfig,
  repository: RenovateRepository,
): Promise<RenovateConfig> {
  const repoConfig = configParser.mergeChildConfig(
    globalConfig,
    is.string(repository) ? { repository } : repository,
  );
  const repoParts = repoConfig.repository.split('/');
  repoParts.pop();
  repoConfig.parentOrg = repoParts.join('/');
  repoConfig.topLevelOrg = repoParts.shift();
  // TODO: types (#22198)
  const platform = GlobalConfig.get('platform')!;
  repoConfig.localDir =
    platform === 'local'
      ? process.cwd()
      : upath.join(
          repoConfig.baseDir,
          `./repos/${platform}/${repoConfig.repository}`,
        );
  await fs.ensureDir(repoConfig.localDir);
  delete repoConfig.baseDir;
  return configParser.filterConfig(repoConfig, 'repository');
}

function getGlobalConfig(): Promise<RenovateConfig> {
  return parseConfigs(getEnv(), process.argv);
}

function haveReachedLimits(): boolean {
  if (isLimitReached('Commits')) {
    logger.info('Max commits created for this run.');
    return true;
  }
  return false;
}

/* istanbul ignore next */
function checkEnv(): void {
  const range = pkg.engines!.node!;
  if (process.release?.name !== 'node' || !process.versions?.node) {
    logger.warn(
      { release: process.release, versions: process.versions },
      'Unknown node environment detected.',
    );
  } else if (!semver.satisfies(process.versions?.node, range)) {
    logger.error(
      { versions: process.versions, range },
      'Unsupported node environment detected. Please update your node version.',
    );
  }
}

export async function validatePresets(config: AllConfig): Promise<void> {
  logger.debug('validatePresets()');
  try {
    await resolveConfigPresets(config);
  } catch (err) /* istanbul ignore next */ {
    logger.error({ err }, CONFIG_PRESETS_INVALID);
    throw new Error(CONFIG_PRESETS_INVALID);
  }
}

export async function start(): Promise<number> {
  // istanbul ignore next
  if (regexEngineStatus.type === 'available') {
    logger.debug('Using RE2 regex engine');
  } else if (regexEngineStatus.type === 'unavailable') {
    logger.warn(
      { err: regexEngineStatus.err },
      'RE2 not usable, falling back to RegExp',
    );
  } else if (regexEngineStatus.type === 'ignored') {
    logger.debug('RE2 regex engine is ignored via RENOVATE_X_IGNORE_RE2');
  }

  let config: AllConfig;
  const env = getEnv();
  try {
    if (is.nonEmptyStringAndNotWhitespace(env.AWS_SECRET_ACCESS_KEY)) {
      addSecretForSanitizing(env.AWS_SECRET_ACCESS_KEY, 'global');
    }
    if (is.nonEmptyStringAndNotWhitespace(env.AWS_SESSION_TOKEN)) {
      addSecretForSanitizing(env.AWS_SESSION_TOKEN, 'global');
    }

    await instrument('config', async () => {
      // read global config from file, env and cli args
      config = await getGlobalConfig();

      // Set allowedHeaders and userAgent in case hostRules headers are configured in file config
      GlobalConfig.set({
        allowedHeaders: config.allowedHeaders,
        userAgent: config.userAgent,
      });
      // initialize all submodules
      config = await globalInitialize(config);

      // Set platform, endpoint, allowedHeaders and userAgent in case local presets are used
      GlobalConfig.set({
        allowedHeaders: config.allowedHeaders,
        platform: config.platform,
        endpoint: config.endpoint,
        userAgent: config.userAgent,
      });

      await validatePresets(config);

      setGlobalLogLevelRemaps(config.logLevelRemap);

      checkEnv();

      // validate secrets and variables. Will throw and abort if invalid
      validateConfigSecretsAndVariables(config);
    });

    // autodiscover repositories (needs to come after platform initialization)
    config = await instrument('discover', () =>
      autodiscoverRepositories(config),
    );

    if (is.nonEmptyString(config.writeDiscoveredRepos)) {
      const content = JSON.stringify(config.repositories);
      await fs.writeFile(config.writeDiscoveredRepos, content);
      logger.info(
        `Written discovered repositories to ${config.writeDiscoveredRepos}`,
      );
      return 0;
    }

    // Iterate through repositories sequentially
    for (const repository of config.repositories!) {
      if (haveReachedLimits()) {
        break;
      }
      await instrument(
        'repository',
        async () => {
          const repoConfig = await getRepositoryConfig(config, repository);
          if (repoConfig.hostRules) {
            logger.debug('Reinitializing hostRules for repo');
            hostRules.clear();
            repoConfig.hostRules.forEach((rule) => hostRules.add(rule));
            repoConfig.hostRules = [];
          }

          // host rules can change concurrency
          queue.clear();
          throttle.clear();

          await repositoryWorker.renovateRepository(repoConfig);
          setMeta({});
        },
        {
          attributes: {
            repository:
              typeof repository === 'string'
                ? repository
                : repository.repository,
          },
        },
      );
    }

    finalizeReport();
    await exportStats(config);
  } catch (err) /* istanbul ignore next */ {
    if (err.message.startsWith('Init: ')) {
      logger.fatal(
        { errorMessage: err.message.substring(6) },
        'Initialization error',
      );
    } else {
      logger.fatal({ err }, 'Unknown error');
    }
    if (!config!) {
      // return early if we can't parse config options
      logger.debug(`Missing config`);
      return 2;
    }
  } finally {
    await globalFinalize(config!);
    if (logLevel() === 'info') {
      logger.info(
        `Renovate was run at log level "${logLevel()}". Set LOG_LEVEL=debug in environment variables to see extended debug logs.`,
      );
    }
  }
  const loggerErrors = getProblems().filter((p) => p.level >= ERROR);
  if (loggerErrors.length) {
    logger.info(
      { loggerErrors },
      'Renovate is exiting with a non-zero code due to the following logged errors',
    );
    return 1;
  }
  return 0;
}
