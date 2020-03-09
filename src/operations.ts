import { google } from 'googleapis';
import { datastore_v1 } from 'googleapis/build/src/apis/datastore/v1';

const scopes = [
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/cloud-platform',
];

function subtractDaysFromNow(days: number): Date {
  const offset = 24 * 60 * 60 * 1000 * days;
  return new Date(Date.now() - offset);
}

function eqSet<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size === b.size && [...a].every(v => b.has(v));
}

// Note
//   namespaceIds = [] means all namespaces
//   namespaceIds = [''] means a default namespace
// https://cloud.google.com/datastore/docs/reference/admin/rest/Shared.Types/EntityFilter
type EntityFilter = datastore_v1.Schema$GoogleDatastoreAdminV1EntityFilter;

function eqEntityFilter(input: EntityFilter, expect: EntityFilter): boolean {
  return (
    eqSet(new Set(input.kinds), new Set(expect.kinds)) &&
    eqSet(new Set(input.namespaceIds), new Set(expect.namespaceIds))
  );
}

export interface FindLatestExportUrlPrefixOptions {
  projectId: string;

  /**
   * Defaults to [""] (this means default namespace)
   */
  namespaces?: string[];

  kinds: string[];

  /**
   * The filter value to search operations recent days of this value.
   * Cannot find the import target correctly if there are over 1000 exports in this period.
   * Defaults to `31`
   */
  recentNDays?: number;
}

export async function findLatestExportUrlPrefix(
  options: FindLatestExportUrlPrefixOptions
): Promise<string> {
  const before = subtractDaysFromNow(options.recentNDays || 31).toISOString();

  const filter = [
    'metadata.common.state: SUCCESSFUL',
    'metadata.common.operationType: EXPORT_ENTITIES',
    `metadata.common.endTime >= "${before}"`,
  ].join(' AND ');

  const auth = new google.auth.GoogleAuth({ scopes });
  const authClient = await auth.getClient();

  const datastore = google.datastore('v1');
  const res = await datastore.projects.operations.list({
    auth: authClient,
    name: `projects/${options.projectId}`,
    pageSize: 1000,
    filter,
  });

  // TODO handle pagenations
  if (res.data.nextPageToken) {
    throw new Error(
      'Too many export operations in this project. Set `recentNDays` options to find the target directory.'
    );
  }

  const expectFilter: EntityFilter = {
    kinds: options.kinds,
    namespaceIds: options.namespaces || [''],
  };

  const target = res.data.operations?.find(op =>
    eqEntityFilter(op.metadata?.entityFilter, expectFilter)
  );

  if (!target) {
    throw new Error('There are no export operations.');
  }

  return target.metadata!.outputUrlPrefix;
}
