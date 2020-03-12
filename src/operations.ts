import {google} from 'googleapis';
import {datastore_v1} from 'googleapis/build/src/apis/datastore/v1';
import {CommonOptions} from './common';

const scopes = [
  'https://www.googleapis.com/auth/datastore',
  'https://www.googleapis.com/auth/cloud-platform',
];

export function subtractDaysFromNow(days: number): Date {
  const offset = 24 * 60 * 60 * 1000 * days;
  return new Date(Date.now() - offset);
}

export function eqAsSet<T>(a?: T[] | null, b?: T[] | null): boolean {
  const [sa, sb] = [new Set(a), new Set(b)];
  return sa.size === sb.size && [...sa].every(v => sb.has(v));
}

// Note
//   namespaceIds = [] means all namespaces
//   namespaceIds = [''] means a default namespace
// https://cloud.google.com/datastore/docs/reference/admin/rest/Shared.Types/EntityFilter
type EntityFilter = datastore_v1.Schema$GoogleDatastoreAdminV1EntityFilter;

export function eqEntityFilter(
  input: EntityFilter,
  expect: EntityFilter
): boolean {
  return (
    eqAsSet(input.kinds, expect.kinds) &&
    eqAsSet(input.namespaceIds, expect.namespaceIds)
  );
}

export interface FindLatestExportUrlPrefixOptions extends CommonOptions {
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

  const auth = new google.auth.GoogleAuth({
    scopes,
    projectId: options.projectId,
  });
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

  // ordered by asc
  const op = res.data.operations
    ?.reverse()
    ?.find(op => eqEntityFilter(op.metadata?.entityFilter, expectFilter));

  return op?.metadata?.outputUrlPrefix;
}
