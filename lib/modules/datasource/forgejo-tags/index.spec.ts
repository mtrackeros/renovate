import { getDigest, getPkgReleases } from '..';
import { ForgejoTagsDatasource } from '.';
import * as httpMock from '~test/http-mock';

const datasource = ForgejoTagsDatasource.id;

describe('modules/datasource/forgejo-tags/index', () => {
  describe('getReleases', () => {
    it('returns tags from code.forgejo.org', async () => {
      const body = [
        {
          name: 'v13.0.0',
          message:
            'v13.0.0\n\nBump to Forgejo 1.20.3\n\nFull changes found here: https://code.forgejo.org/forgejo-helm/forgejo-helm/compare/v12.5.4...v13.0.0',
          id: '515865ec4a99bfd05de0334c258d9e46163c2b4c',
          commit: {
            url: 'https://code.forgejo.org/forgejo-helm/forgejo-helm/git/commits/515865ec4a99bfd05de0334c258d9e46163c2b4c',
            sha: '35fcb41ce2d03b44186cc82d4ea619dc2fcb6f7d',
            created: '2023-08-21T16:27:29Z',
          },
          zipball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v13.0.0.zip',
          tarball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v13.0.0.tar.gz',
        },
        {
          name: 'v12.5.4',
          message: 'v12.5.4',
          id: '4439267777d70ccd16733c8e95da1e4437cc2378',
          commit: {
            url: 'https://code.forgejo.org/forgejo-helm/forgejo-helm/git/commits/1ac7e35c9734106d92306cd91b157eac343c4cf5',
            sha: '1ea6cb4633c2e01d02dc910bcb67d7710842abc7',
            created: '2023-07-31T07:04:49Z',
          },
          zipball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v12.5.4.zip',
          tarball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v12.5.4.tar.gz',
        },
        {
          name: 'v9.0.4',
          message: 'v9.0.4',
          id: '478fd6044e971d3c991e34fa449201397c2f5ea8',
          commit: {
            url: 'https://code.forgejo.org/forgejo-helm/forgejo-helm/git/commits/478fd6044e971d3c991e34fa449201397c2f5ea8',
            sha: '478fd6044e971d3c991e34fa449201397c2f5ea8',
            created: '2023-07-22T12:06:30Z',
          },
          zipball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.4.zip',
          tarball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.4.tar.gz',
        },
        {
          name: 'v9.0.3',
          message: 'v9.0.3',
          id: 'aa8f543c08f874754ccc3e5f136e0b46742b3992',
          commit: {
            url: 'https://code.forgejo.org/forgejo-helm/forgejo-helm/git/commits/aa8f543c08f874754ccc3e5f136e0b46742b3992',
            sha: 'aa8f543c08f874754ccc3e5f136e0b46742b3992',
            created: '2023-07-19T21:45:28Z',
          },
          zipball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.3.zip',
          tarball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.3.tar.gz',
        },
        {
          name: 'v9.0.2',
          message: 'v9.0.2',
          id: '81612bd7882f0b3b5d70308a8e7fcfb5d165ec7c',
          commit: {
            url: 'https://code.forgejo.org/forgejo-helm/forgejo-helm/git/commits/81612bd7882f0b3b5d70308a8e7fcfb5d165ec7c',
            sha: '81612bd7882f0b3b5d70308a8e7fcfb5d165ec7c',
            created: '2023-07-19T19:54:12Z',
          },
          zipball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.2.zip',
          tarball_url:
            'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.2.tar.gz',
        },
      ];
      httpMock
        .scope('https://code.forgejo.org')
        .get('/api/v1/repos/forgejo-helm/forgejo-helm/tags')
        .reply(200, body);
      const res = await getPkgReleases({
        datasource,
        packageName: 'forgejo-helm/forgejo-helm',
      });
      expect(res).toEqual({
        registryUrl: 'https://code.forgejo.org',
        releases: [
          {
            gitRef: 'v9.0.2',
            newDigest: '81612bd7882f0b3b5d70308a8e7fcfb5d165ec7c',
            releaseTimestamp: '2023-07-19T19:54:12.000Z',
            version: 'v9.0.2',
          },
          {
            gitRef: 'v9.0.3',
            newDigest: 'aa8f543c08f874754ccc3e5f136e0b46742b3992',
            releaseTimestamp: '2023-07-19T21:45:28.000Z',
            version: 'v9.0.3',
          },
          {
            gitRef: 'v9.0.4',
            newDigest: '478fd6044e971d3c991e34fa449201397c2f5ea8',
            releaseTimestamp: '2023-07-22T12:06:30.000Z',
            version: 'v9.0.4',
          },
          {
            gitRef: 'v12.5.4',
            newDigest: '1ea6cb4633c2e01d02dc910bcb67d7710842abc7',
            releaseTimestamp: '2023-07-31T07:04:49.000Z',
            version: 'v12.5.4',
          },
          {
            gitRef: 'v13.0.0',
            newDigest: '35fcb41ce2d03b44186cc82d4ea619dc2fcb6f7d',
            releaseTimestamp: '2023-08-21T16:27:29.000Z',
            version: 'v13.0.0',
          },
        ],
        sourceUrl: 'https://code.forgejo.org/forgejo-helm/forgejo-helm',
      });
    });

    it('returns tags from codeberg.org', async () => {
      const body = [
        {
          name: '0.11.0',
          message:
            'fix(deps): update helm release postgresql to v12.9.0 (#174)\n\nReviewed-on: https://codeberg.org/forgejo-contrib/forgejo-helm/pulls/174\nCo-authored-by: Michael Kriese <viceice@noreply.codeberg.org>\nCo-committed-by: Michael Kriese <viceice@noreply.codeberg.org>',
          id: '7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
          commit: {
            url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/commits/7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
            sha: '7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
            created: '2023-08-25T08:26:28Z',
          },
          zipball_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/archive/0.11.0.zip',
          tarball_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/archive/0.11.0.tar.gz',
        },
        {
          name: 'v0.10.1',
          message:
            'fix(deps): update forgejo docker tag to v1.20.2-0 (#171)\n\nCo-authored-by: Michael Kriese <viceice@noreply.codeberg.org>\nReviewed-on: https://codeberg.org/forgejo-contrib/forgejo-helm/pulls/171',
          id: 'ecd9b535a128d4e6d643fde37bb05cd751b8d9f4',
          commit: {
            url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/commits/ecd9b535a128d4e6d643fde37bb05cd751b8d9f4',
            sha: 'ecd9b535a128d4e6d643fde37bb05cd751b8d9f4',
            created: '2023-08-02T20:30:48Z',
          },
          zipball_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/archive/v0.10.1.zip',
          tarball_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/archive/v0.10.1.tar.gz',
        },
        {
          name: 'v0.10.0',
          message:
            'feat(deps)!: update forgejo docker tag to v1.20.1-0 (#167)\n\nBREAKING CHANGE: Forgejo minor update\n\nCo-authored-by: Michael Kriese <viceice@noreply.codeberg.org>\nReviewed-on: https://codeberg.org/forgejo-contrib/forgejo-helm/pulls/167',
          id: '5677cf39d4818da26931783a3438a660ae5f427d',
          commit: {
            url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/commits/5677cf39d4818da26931783a3438a660ae5f427d',
            sha: '5677cf39d4818da26931783a3438a660ae5f427d',
            created: '2023-07-27T06:18:23Z',
          },
          zipball_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/archive/v0.10.0.zip',
          tarball_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/archive/v0.10.0.tar.gz',
        },
      ];
      httpMock
        .scope('https://codeberg.org')
        .get('/api/v1/repos/forgejo-contrib/forgejo-helm/tags')
        .reply(200, body);
      const res = await getPkgReleases({
        datasource,
        registryUrls: ['https://codeberg.org'],
        packageName: 'forgejo-contrib/forgejo-helm',
      });
      expect(res).toEqual({
        registryUrl: 'https://codeberg.org',
        releases: [
          {
            gitRef: 'v0.10.0',
            newDigest: '5677cf39d4818da26931783a3438a660ae5f427d',
            releaseTimestamp: '2023-07-27T06:18:23.000Z',
            version: 'v0.10.0',
          },
          {
            gitRef: 'v0.10.1',
            newDigest: 'ecd9b535a128d4e6d643fde37bb05cd751b8d9f4',
            releaseTimestamp: '2023-08-02T20:30:48.000Z',
            version: 'v0.10.1',
          },
          {
            gitRef: '0.11.0',
            newDigest: '7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
            releaseTimestamp: '2023-08-25T08:26:28.000Z',
            version: '0.11.0',
          },
        ],
        sourceUrl: 'https://codeberg.org/forgejo-contrib/forgejo-helm',
      });
    });
  });

  describe('getDigest', () => {
    it('returns commits from codeberg.org', async () => {
      const body = [
        {
          url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/commits/7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
          sha: '7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
          created: '2023-08-25T08:26:28Z',
          html_url:
            'https://codeberg.org/forgejo-contrib/forgejo-helm/commit/7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
          commit: {
            url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/commits/7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
            message:
              'fix(deps): update helm release postgresql to v12.9.0 (#174)\n\nReviewed-on: https://codeberg.org/forgejo-contrib/forgejo-helm/pulls/174\nCo-authored-by: Michael Kriese <viceice@noreply.codeberg.org>\nCo-committed-by: Michael Kriese <viceice@noreply.codeberg.org>\n',
            tree: {
              url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/trees/7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
              sha: '7eb7edcfd00ffab9dddbae9e9b2deace305c9a84',
              created: '2023-08-25T08:26:28Z',
            },
            verification: null,
          },
          parents: [
            {
              url: 'https://codeberg.org/api/v1/repos/forgejo-contrib/forgejo-helm/git/commits/f19d22c6643b4643c4b2e96482b07527c84d2106',
              sha: 'f19d22c6643b4643c4b2e96482b07527c84d2106',
              created: '0001-01-01T00:00:00Z',
            },
          ],
          files: null,
          stats: null,
        },
      ];
      httpMock
        .scope('https://codeberg.org')
        .get(
          '/api/v1/repos/forgejo-contrib/forgejo-helm/commits?stat=false&verification=false&files=false&page=1&limit=1',
        )
        .reply(200, body);

      const res = await getDigest({
        datasource,
        registryUrls: ['https://codeberg.org'],
        packageName: 'forgejo-contrib/forgejo-helm',
      });
      expect(res).toBe('7eb7edcfd00ffab9dddbae9e9b2deace305c9a84');
    });
  });

  describe('getDigest with no commits', () => {
    it('returns null from code.forgejo.org when no commits found', async () => {
      httpMock
        .scope('https://code.forgejo.org')
        .get(
          '/api/v1/repos/forgejo-helm/forgejo-helm/commits?stat=false&verification=false&files=false&page=1&limit=1',
        )
        .reply(200, []);
      const res = await getDigest({
        datasource,
        packageName: 'forgejo-helm/forgejo-helm',
      });
      expect(res).toBeNull();
    });
  });

  describe('getTagCommit', () => {
    it('returns tags commit hash from code.forgejo.org', async () => {
      const body = {
        name: 'v9.0.1',
        message: 'v9.0.1',
        id: 'fb4d493a588380ac7a4037d81664363415f31650',
        commit: {
          url: 'https://code.forgejo.org/forgejo-helm/forgejo-helm/git/commits/fb4d493a588380ac7a4037d81664363415f31650',
          sha: '29c9bbb4bfec04ab22761cc2d999eb0fcb8acbed',
          created: '2023-07-19T08:42:55+02:00',
        },
        zipball_url:
          'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.1.zip',
        tarball_url:
          'https://code.forgejo.org/forgejo-helm/forgejo-helm/archive/v9.0.1.tar.gz',
      };
      httpMock
        .scope('https://code.forgejo.org')
        .get('/api/v1/repos/forgejo-helm/forgejo-helm/tags/v9.0.1')
        .reply(200, body);
      const res = await getDigest(
        {
          datasource,
          packageName: 'forgejo-helm/forgejo-helm',
        },
        'v9.0.1',
      );
      expect(res).toBe('29c9bbb4bfec04ab22761cc2d999eb0fcb8acbed');
    });
  });
});
