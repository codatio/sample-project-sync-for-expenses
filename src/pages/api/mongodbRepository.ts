import { Db, MongoClient } from "mongodb";
import {
  CompletedPullOperation,
  CompletedPullOperations,
  Repository,
  SyncOutcome,
  SyncOutcomes,
} from "./repository";

const connectionString = process.env.OPTIONAL_MONGODB_CONNECTION_STRING;

const startDb = async () => {
  if (!connectionString) return;

  const client = new MongoClient(connectionString);
  await client.connect();
  return client.db();
};

const db = await startDb();

const completedPullOperations: CompletedPullOperations = {
  add: async (pullOperation: CompletedPullOperation) => {
    if (db === undefined) throw new Error("mongodb database not initialised");

    const collection = db.collection("completedPullOperations");
    await collection.updateOne(
      { companyId: pullOperation.companyId, dataType: pullOperation.dataType },
      { $set: pullOperation },
      { upsert: true }
    );
  },
  get: async (companyId: string, dataType: string) => {
    if (db === undefined) throw new Error("mongodb database not initialised");
    const collection = db.collection<CompletedPullOperation>("completedPullOperations");
    return await collection.findOne({ companyId, dataType }) || undefined;
  },
};

const syncOutcomes: SyncOutcomes = {
  add: async (syncOutcome: SyncOutcome) => {
    if (db === undefined) throw new Error("mongodb database not initialised");
    const collection = db.collection("syncOutcomes");
    await collection.updateOne(
      { syncId: syncOutcome.syncId },
      { $set: syncOutcome },
      { upsert: true }
    );
  },
  get: async (syncId: string) => {
    if (db === undefined) throw new Error("mongodb database not initialised");
    const collection = db.collection<SyncOutcome>("syncOutcomes");
    return await collection.findOne({ syncId }) || undefined;
  },
};

class MongoDbRepository implements Repository {
  constructor(
    private _completedPullOperations: CompletedPullOperations,
    private _syncOutcomes: SyncOutcomes
  ) {}

  get completedPullOperations(): CompletedPullOperations {
    return this._completedPullOperations;
  }

  get syncOutcomes(): SyncOutcomes {
    return this._syncOutcomes;
  }
}

export const repository = new MongoDbRepository(
  completedPullOperations,
  syncOutcomes
);
