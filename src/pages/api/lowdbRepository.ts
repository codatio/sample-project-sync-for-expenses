import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import AsyncLock from "async-lock";
import {
  CompletedPullOperation,
  CompletedPullOperationDocument,
  CompletedPullOperations,
  Repository,
  SyncOutcomeDocument,
  SyncOutcomes,
} from "./repository";

interface Database {
  completedPullOperations: CompletedPullOperationDocument[];
  syncOutcomes: SyncOutcomeDocument[];
}

const lock = new AsyncLock();

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");

const adapter = new JSONFile<Database>(file);
const defaultData = { syncOutcomes: [], completedPullOperations: [] };
const db = new Low(adapter, defaultData);

const completedPullOperations: CompletedPullOperations = {
  add: async (companyId: string, pullOperation: CompletedPullOperation) => {
    return await lock.acquire("database-lock", async () => {
      try {
        await db.read();
        const doc = db.data.completedPullOperations.find(
          (x) => x.companyId === companyId
        );
        if (!doc) {
          db.data.completedPullOperations.push({
            companyId,
            createdAt: new Date(),
            operations: [pullOperation],
          });
        } else {
          doc.operations.push(pullOperation);
        }

        await db.write();
      } catch (error) {
        console.error("Error writing to database:", error);
        throw error;
      }
    });
  },
  get: async (companyId: string) => {
    return await lock.acquire("database-lock", async () => {
      try {
        await db.read();
        return db.data.completedPullOperations.find(
          (x) => x.companyId === companyId
        );
      } catch (error) {
        console.error("Error reading from database:", error);
        throw error;
      }
    });
  },
};

const syncOutcomes: SyncOutcomes = {
  add: async (syncOutcome: SyncOutcomeDocument) => {
    return await lock.acquire("database-lock", async () => {
      try {
        await db.read();
        db.data.syncOutcomes.push(syncOutcome);
        await db.write();
      } catch (error) {
        console.error("Error writing to database:", error);
        throw error;
      }
    });
  },
  get: async (syncId: string) => {
    return await lock.acquire("database-lock", async () => {
      try {
        await db.read();
        return db.data.syncOutcomes.find((x) => x.syncId === syncId);
      } catch (error) {
        console.error("Error reading from database:", error);
        throw error;
      }
    });
  },
};

class LowDbRepository implements Repository {
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

export const repository = new LowDbRepository(
  completedPullOperations,
  syncOutcomes
);
