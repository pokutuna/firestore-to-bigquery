import { google } from 'googleapis';
import { bigquery_v2 } from 'googleapis/build/src/apis/bigquery/v2';

const scopes = ['https://www.googleapis.com/auth/bigquery'];

export interface LoadToBigQueryOptions {
  projectId: string;

  /**
   * Defaults to [""] (this means default namespace)
   */
  namespaces?: string[];

  /**
   * Names of kind (Datastore mode) or collection (Firestore mode) to load to BigQuery.
   * This is used for table name.
   */
  kinds: string[];

  /**
   * A location path to export data on Google Cloud Storage.
   * This must be a string starting with "gs://..."
   */
  sourceUrlPrefix: string;

  destination: {
    /**
     * Id of the project having dataset loading data to.
     * Defaults to the current projectId.
     */
    projectId?: string;

    /**
     * Id of the dataset to load the export data.
     * If you give more than 1 namespace, this loads data to ${dataset_id}_${namespace}
     */
    datasetId: string;
  };

  /**
   * A function to generate partitioning setting by kind name.
   * If this returns undefined, it doesn't create partitions based on timestamp.
   * This works high priority than `rangePartitionedBy`.
   */
  timePartitionedBy?: (
    kind: string
  ) => bigquery_v2.Schema$TimePartitioning | undefined;

  /**
   * A function to generate partitioning setting by kind name.
   * If this returns undefined, it doesn't create partitions based on integer value.
   * This works low priority than `timePartitionedBy`.
   */
  rangePartitionedBy?: (
    kind: string
  ) => bigquery_v2.Schema$RangePartitioning | undefined;
}

export function translateNamespaces(
  namespaces: string[] | undefined
): string[] {
  if (!namespaces) return ['default'];
  if (namespaces.length === 0) return ['all'];
  return namespaces.map(ns => (ns === '' ? 'default' : ns));
}

export function makeSourcePath(
  prefix: string,
  namespace: string,
  kind: string
): string {
  return [
    prefix,
    `${namespace}_namespace`,
    `kind_${kind}`,
    `${namespace}_namespace_kind_${kind}.export_metadata`,
  ].join('/');
}

export function makeDatasetId(
  datasetId: string,
  namespaces: string[],
  namespace: string
): string {
  const useNamespaceSuffix = namespaces.length !== 1;
  return useNamespaceSuffix ? `${datasetId}_${namespace}` : datasetId;
}

export function makePartitioning(
  options: Pick<
    LoadToBigQueryOptions,
    'timePartitionedBy' | 'rangePartitionedBy'
  >,
  kind: string
): LoadJobUnit['partitioning'] {
  const timePartitioning = options.timePartitionedBy?.(kind);
  if (timePartitioning) return { timePartitioning };

  const rangePartitioning = options.rangePartitionedBy?.(kind);
  if (rangePartitioning) return { rangePartitioning };

  return undefined;
}

export interface LoadJobUnit {
  sourcePath: string;
  datasetId: string;
  tableId: string;
  partitioning:
    | { timePartitioning: bigquery_v2.Schema$TimePartitioning }
    | { rangePartitioning: bigquery_v2.Schema$RangePartitioning }
    | undefined;
}

export function expandToJobs(options: LoadToBigQueryOptions): LoadJobUnit[] {
  const units: LoadJobUnit[] = [];

  const namespaces = translateNamespaces(options.namespaces);
  namespaces.forEach(ns => {
    options.kinds.forEach(kind => {
      units.push({
        sourcePath: makeSourcePath(options.sourceUrlPrefix, ns, kind),
        datasetId: makeDatasetId(options.destination.datasetId, namespaces, ns),
        tableId: kind,
        partitioning: makePartitioning(options, kind),
      });
    });
  });

  return units;
}

export async function loadToBigQuery(options: LoadToBigQueryOptions) {
  const auth = new google.auth.GoogleAuth({ scopes });
  const authClient = await auth.getClient();

  const jobs = expandToJobs(options);

  const bq = google.bigquery('v2');

  jobs.map(async job =>
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
              projectId: options.destination.projectId || options.projectId,
              datasetId: job.datasetId,
              tableId: job.tableId,
            },
            ...job.partitioning,

            sourceUris: [job.sourcePath],
            sourceFormat: 'DATASTORE_BACKUP',

            createDisposition: 'CREATE_IF_NEEDED',
            writeDisposition: 'WRITE_TRUNCATE',
          },
        },
      },
    })
  );
}
