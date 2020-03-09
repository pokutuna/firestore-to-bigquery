import { exportDatastore } from './export';
import { findLatestExportUrlPrefix } from './operations';

const projectId = 'pokutuna-dev';
const namespaces = [''];
const kinds = ['users', 'cities'];
const bucket = 'pokutuna-firestore-export';

const dataset = 'firestore_import';
const table = 'import';

// import export の IAM が必要
// bucket と db のリージョンは同じである必要がある

const build = {
  steps: [
    {
      name: 'gcr.io/cloud-builders/gcloud',
      args: [
        'datastore',
        'export',
        `--namespaces=${namespaces.join(',')}`,
        `--kinds=${kinds.join(',')}`,
        '--async',
        `gs://${bucket}`,
      ],
    },
  ],
};

const load = {
  steps: [
    {
      name: 'gcr.io/cloud-builders/gcloud',
      entrypoint: 'bq',
      args: [
        'load',
        // '--location=asia-northeast1',
        '--source_format=DATASTORE_BACKUP',
        // '--time_partitioning_field=,
        '--replace',
        `${dataset}.${table}`,
        'gs://pokutuna-firestore-export/2020-03-05T00:27:33_8744/default_namespace/kind_users/default_namespace_kind_users.export_metadata',
      ],
    },
  ],
};

// bigquery.jobs.create が必要

(async () => {
  // const client = new CloudBuildClient();
  // const res = await client.createBuild({
  //   projectId,
  //   // build,
  //   build: load,
  // });
  // console.log(res);

  //const res = await exportDatastore({
  //  projectId,
  //  namespaces,
  //  kinds,
  //  bucket,
  //});
  //console.log(res);

  console.log(await findLatestExportUrlPrefix({ projectId, kinds: ['users', 'cities'] }));
})();
