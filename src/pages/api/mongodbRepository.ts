import { MongoClient } from "mongodb";
import {
  CompletedPullOperation,
  CompletedPullOperationDocument,
  CompletedPullOperations,
  Repository,
  SyncOutcomeDocument,
  SyncOutcomes,
} from "./repository";

const connectionString = process.env.OPTIONAL_MONGODB_CONNECTION_STRING;

const startDb = async () => {
  if (!connectionString) return;

  const client = new MongoClient(connectionString);
  await client.connect();

  const db = client.db();

  await db.collection("completedPullOperations").createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 }
  );

  await db.collection("syncOutcomes").createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 }
  );

  return db;
};

const db = await startDb();

const completedPullOperations: CompletedPullOperations = {
  add: async (companyId: string, pullOperation: CompletedPullOperation) => {
    if (db === undefined) throw new Error("mongodb database not initialised");

    const collection = db.collection("completedPullOperations");

    await collection.updateOne(
      { companyId: companyId },
      {
        $push: { operations: pullOperation },
        $setOnInsert: { companyId: companyId, createdAt: new Date() },
      },
      { upsert: true }
    );
  },
  get: async (companyId: string) => {
    if (db === undefined) throw new Error("mongodb database not initialised");
    const collection = db.collection<CompletedPullOperationDocument>("completedPullOperations");
    const doc = await collection.findOne({ companyId });
    return doc || undefined;
  },
};

const syncOutcomes: SyncOutcomes = {
  add: async (syncOutcome: SyncOutcomeDocument) => {
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
    const collection = db.collection<SyncOutcomeDocument>("syncOutcomes");
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
