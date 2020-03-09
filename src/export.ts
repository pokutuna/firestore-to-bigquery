import { google, datastore_v1 } from 'googleapis';

export interface ExportOptions {
  projectId: string;

  /**
   * Defaults to [""] (this means default namespace)
   */
  namespaces?: string[];

  kinds: string[];
  bucket: string;
}


const scopes = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/datastore',
];

// requires
// - roles/datastore.importExportAdmin
// - roles/storage.admin

export async function exportDatastore(
  options: ExportOptions
): Promise<datastore_v1.Schema$GoogleLongrunningOperation> {
  const auth = new google.auth.GoogleAuth({ scopes });
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
      outputUrlPrefix: `gs://${options.bucket}`,
    },
  });
  return (res as any).data;
}
