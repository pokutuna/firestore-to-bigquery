import * as op from './operations';

import {google} from 'googleapis';
jest.mock('googleapis');
const mocked = google as jest.Mocked<typeof google>;

test('eqAsSet', () => {
  expect(op.eqAsSet(['1', '2', '3'], ['2', '1', '3'])).toBe(true);
  expect(op.eqAsSet(['1', '2'], ['2', '1', '3'])).toBe(false);
  expect(op.eqAsSet(['1', '2', '3'], ['2', '1'])).toBe(false);
  expect(op.eqAsSet([], null)).toBe(true);
  expect(op.eqAsSet([], undefined)).toBe(true);
});

describe('findLatestExportUrlPrefix', () => {
  const list = jest.fn();
  const datastore = {
    projects: {
      operations: {
        list,
      },
    },
  };
  mocked.datastore.mockReturnValue(datastore as any);

  const options = {
    projectId: 'test',
    kinds: ['foo', 'bar'],
  };

  it('returns a latest matched opration', async () => {
    list.mockReturnValue(
      Promise.resolve({
        data: {
          operations: [
            {
              metadata: {
                entityFilter: {
                  namespaceIds: [''],
                  kinds: ['foo', 'bar'],
                },
                outputUrlPrefix: 'gs://not-latest',
              },
            },
            {
              name: 'not matched',
              metadata: {
                entityFilter: {
                  namespaceIds: ['all'],
                  kinds: ['foo', 'bar'],
                },
                outputUrlPrefix: 'gs://not-matched',
              },
            },
            {
              metadata: {
                entityFilter: {
                  namespaceIds: [''],
                  kinds: ['foo', 'bar'],
                },
                outputUrlPrefix: 'gs://expected',
              },
            },
          ],
        },
      })
    );

    const got = await op.findLatestExportUrlPrefix(options);
    expect(got).toBe('gs://expected');
  });

  it('returns undefined when operations empty', async () => {
    list.mockReturnValue(
      Promise.resolve({
        data: {
          operations: [],
        },
      })
    );

    const got = await op.findLatestExportUrlPrefix(options);
    expect(got).toBeUndefined();
  });

  it('gives up with pagenation', async () => {
    list.mockReturnValue(
      Promise.resolve({
        data: {
          nextPageToken: 'NEXT_PAGE_IS_HERE',
        },
      })
    );

    await expect(op.findLatestExportUrlPrefix(options)).rejects.toThrow(
      /Too many export operations/
    );
  });
});
