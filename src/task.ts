import {exportDatastore, ExportOptions} from './export';
import {
  findLatestExportUrlPrefix,
  FindLatestExportUrlPrefixOptions,
} from './operations';
import {loadToBigQuery, LoadToBigQueryOptions} from './load';

export async function requestExportFirestore(options: ExportOptions) {
  return exportDatastore(options);
}

export type LoadOptions = FindLatestExportUrlPrefixOptions &
  Omit<LoadToBigQueryOptions, 'sourceUrlPrefix'>;

export async function requestLoadToBigQuery(options: LoadOptions) {
  const sourceUrlPrefix = await findLatestExportUrlPrefix(options);
  return loadToBigQuery({...options, sourceUrlPrefix});
}
