import { google } from 'googleapis';

const scopes = ['https://www.googleapis.com/auth/bigquery'];

export interface LoadOptions {
  projectId: string;

  /**
   * Defaults to [""] (this means default namespace)
   */
  namespaces?: string[];

  kinds: string[];

  bucket: string;
}

export async function loadToBigQuery(options: LoadOptions) {
  const auth = new google.auth.GoogleAuth({ scopes });
  const authClient = await auth.getClient();

  const bq = google.bigquery('v2');

  bq.jobs.insert({
    auth: authClient,
    projectId: options.projectId,
    requestBody: {
      jobReference: {
        projectId: options.projectId,
      },
      configuration: {
        load: {
          destinationTable: {
            projectId: '',
            datasetId: '',
            tableId: '',
          },
          // rangePartitioning
          // timePartitioning: { expirationMs: ..., field: ... }
          sourceUris: [],
          sourceFormat: 'DATASTORE_BACKUP',
          createDisposition: 'CREATE_IF_NEEDED',
          writeDisposition: 'WRITE_TRUNCATE',
        },
      },
    },
  });
}
