import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import AsyncLock from "async-lock";

interface Database {
  completedPullOperations: CompletedPullOperation[];
  syncOutcomes: SyncOutcome[];
}

export interface SyncOutcome {
  companyId: string;
  syncId: string;
  result: "success" | "failure";
}

export interface CompletedPullOperation {
  companyId: string;
  dataType: string;
  completedAt: Date;
}

const lock = new AsyncLock();

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "db.json");

const adapter = new JSONFile<Database>(file);
const defaultData = { syncOutcomes: [], completedPullOperations: [] };
const db = new Low(adapter, defaultData);

export const completedPullOperations = {
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

export const syncOutcomes = {
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
