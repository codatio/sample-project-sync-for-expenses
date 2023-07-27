import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import AsyncLock from "async-lock";
import { CompletedPullOperation, CompletedPullOperations, Repository, SyncOutcome, SyncOutcomes } from "./repository";

interface Database {
  completedPullOperations: CompletedPullOperation[];
  syncOutcomes: SyncOutcome[];
}

const lock = new AsyncLock();

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");

const adapter = new JSONFile<Database>(file);
const defaultData = { syncOutcomes: [], completedPullOperations: [] };
const db = new Low(adapter, defaultData);

const completedPullOperations: CompletedPullOperations = {
  add: async (pullOperation: CompletedPullOperation) => {
    await lock.acquire("pull-ops", async () => {
      db.data.completedPullOperations.push(pullOperation);
      await db.write();
    });
  },
  get: async (companyId: string, dataType: string) => {
    await db.read();
    return db.data.completedPullOperations.find(
      (x) => x.companyId === companyId && x.dataType === dataType
    );
  },
};

const syncOutcomes: SyncOutcomes = {
  add: async (syncOutcome: SyncOutcome) => {
    await lock.acquire("sync-outcomes", async () => {
      db.data.syncOutcomes.push(syncOutcome);
      await db.write();
    });
  },
  get: async (syncId: string) => {
    await db.read();
    return db.data.syncOutcomes.find((x) => x.syncId === syncId);
  },
};
class LowDbRepository implements Repository {
    constructor(
        private _completedPullOperations: CompletedPullOperations,
        private _syncOutcomes: SyncOutcomes) {}

    get completedPullOperations(): CompletedPullOperations {
        return this._completedPullOperations;
    }

    get syncOutcomes(): SyncOutcomes {
        return this._syncOutcomes;
    }
}

export const repository = new LowDbRepository(completedPullOperations, syncOutcomes);

