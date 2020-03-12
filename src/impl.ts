import {ExportOptions} from './export';
import {
  requestExportFirestore,
  requestLoadToBigQuery,
  LoadOptions,
} from './task';

import {Request, Response} from 'express';

export function makeFunction(options: ExportOptions & LoadOptions) {
  return async (req: Request, res: Response) => {
    const action = req.body.action;

    if (action === 'export') {
      await requestExportFirestore(options);
      return res.status(200).send('export requested');
    }

    if (action === 'load') {
      await requestLoadToBigQuery(options);
      return res.status(200).send('load requested');
    }

    console.warn('action not found');
    return res.status(400).send('action not found');
  };
}
