import {ExportOptions} from './export';
import {
  requestExportFirestore,
  requestLoadToBigQuery,
  LoadOptions,
} from './task';

import {Request, Response} from 'express';

/**
 * @example
 * const { makePubSubFunction } = require('@pokutuna/firestore-to-biguqery');
 *
 * // Function to deploy Cloud Functions with http trigger
 * export const syncToBigquery = makeFunction({
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
export async function makeFunction(options: ExportOptions & LoadOptions) {
  return async (req: Request, res: Response) => {
    const action = req.body.action;

    if (action === 'export') {
      await requestExportFirestore(options);
      return res.status(204);
    }

    if (action === 'load') {
      await requestLoadToBigQuery(options);
      return res.status(204);
    }

    console.warn('action not found');
    return res.status(400);
  };
}
