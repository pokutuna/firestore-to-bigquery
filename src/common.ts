export interface CommonOptions {
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
}
