import {repository as lowDbRepository} from './lowdbRepository'
import {repository as mongodbRepository} from './mongodbRepository'

export interface SyncOutcomeDocument {
  companyId: string;
  syncId: string;
  result: "success" | "failure";
  createdAt: Date;
}

export interface CompletedPullOperationDocument {
  companyId: string;
  operations: CompletedPullOperation[];
  createdAt: Date;
}

export interface CompletedPullOperation {
dataType: string;
  completedAt: Date;
}

export interface Repository {
  get syncOutcomes(): SyncOutcomes,
  get completedPullOperations(): CompletedPullOperations
}

export interface SyncOutcomes {
  add: (syncOutcome: SyncOutcomeDocument) => Promise<void>;
  get: (syncId: string) => Promise<SyncOutcomeDocument | undefined>
}

export interface CompletedPullOperations {
  add: (companyId: string, pullOperation: CompletedPullOperation) => Promise<void>;
  get: (companyId: string) => Promise<CompletedPullOperationDocument | undefined>
}

let repository: Repository;
const mongodbConnectionString = process.env.OPTIONAL_MONGODB_CONNECTION_STRING;

if (mongodbConnectionString) {
  repository = mongodbRepository;
} else {
  repository = lowDbRepository;
}

export {repository}