import {exportDatastore} from './export';
import {google} from 'googleapis';

jest.mock('googleapis');
const mocked = google as jest.Mocked<typeof google>;

test('exportData', async () => {
  const mockedExport = jest.fn().mockReturnValue({data: 'mocked'});
  const datastore = {
    projects: {
      export: mockedExport,
    },
  };
  mocked.datastore.mockReturnValue(datastore as any);

  await exportDatastore({
    projectId: 'test',
    kinds: ['foo', 'bar'],
    exportBucket: 'my-bucket',
  });

  expect(datastore.projects.export).toBeCalledWith(
    expect.objectContaining({
      projectId: 'test',
      requestBody: {
        entityFilter: {
          kinds: ['foo', 'bar'],
          namespaceIds: [''],
        },
        outputUrlPrefix: 'gs://my-bucket',
      },
    })
  );
});
