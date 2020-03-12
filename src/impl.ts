import {ExportOptions} from './export';
import {
  requestExportFirestore,
  requestLoadToBigQuery,
  LoadOptions,
} from './task';

import {Request, Response} from 'express';

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
