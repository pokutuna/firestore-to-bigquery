import {google, datastore_v1} from 'googleapis';
import {CommonOptions} from './common';

export interface ExportOptions extends CommonOptions {
  exportBucket: string;
}

const scopes = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/datastore',
];

export async function exportDatastore(
  options: ExportOptions
): Promise<datastore_v1.Schema$GoogleLongrunningOperation> {
  const auth = new google.auth.GoogleAuth({
    scopes,
    projectId: options.projectId,
  });
  const authClient = await auth.getClient();

  const datastore = google.datastore('v1');
  const res = await datastore.projects.export({
    auth: authClient,
    projectId: options.projectId,
    requestBody: {
      entityFilter: {
        kinds: options.kinds,
        namespaceIds: options.namespaces || [''],
      },
      outputUrlPrefix: `gs://${options.exportBucket}`,
    },
  });
  return res.data;
}
