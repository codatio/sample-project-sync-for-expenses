import {repository as lowDbRepository} from './lowdbRepository'
import {repository as mongodbRepository} from './mongodbRepository'

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

export interface Repository {
  get syncOutcomes(): SyncOutcomes,
  get completedPullOperations(): CompletedPullOperations
}

export interface SyncOutcomes {
  add: (syncOutcome: SyncOutcome) => Promise<void>;
  get: (syncId: string) => Promise<SyncOutcome | undefined>
}

export interface CompletedPullOperations {
  add: (pullOperation: CompletedPullOperation) => Promise<void>;
  get: (companyId: string, dataType: string) => Promise<CompletedPullOperation | undefined>
}

let repository: Repository;
const mongodbConnectionString = process.env.OPTIONAL_MONGODB_CONNECTION_STRING;

if (mongodbConnectionString) {
  repository = mongodbRepository;
} else {
  repository = lowDbRepository;
}

export {repository}