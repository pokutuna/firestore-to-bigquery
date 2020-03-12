import {ExportOptions} from './export';
import {
  requestExportFirestore,
  requestLoadToBigQuery,
  LoadOptions,
} from './task';

type PubSubMessage = {data: Buffer};

/**
 * @example
 * const { makePubSubFunction } = require('@pokutuna/firestore-to-biguqery');
 *
 * // Function to deploy Cloud Functions subscribing Pub/Sub
 * export const syncToBigquery = makePubSubFunction({
 *   projectId: "my-project",
 *   kinds: ["foo", "bar"],
 *   exportBucket: "",
 *   destination: {
 *     datasetId: "datastore",
 *     location: "asia-northeast1",
 *   },
 *   timePartitionBy: (kind) => {
 *     if (kind === "foo") return { field: "createdAt" };
 *     return undefined;
 *   },
 * });
 */
export async function makePubSubFunction(options: ExportOptions & LoadOptions) {
  return async (message: PubSubMessage) => {
    const data = JSON.parse(
      Buffer.from((message.data || '').toString(), 'base64').toString()
    );

    if (data.action === 'export') {
      await requestExportFirestore(options);
    }

    if (data.action === 'load') {
      await requestLoadToBigQuery(options);
    }

    console.warn('action not found');
    return;
  };
}
