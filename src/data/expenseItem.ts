import { ExpenseTransactionType } from "@codat/sync-for-expenses/dist/sdk/models/shared/expensetransaction";

export interface ExpenseItem {
  id: string;
  type: ExpenseTransactionType;
  employeeName: string;
  description: string;
  categories: TrackingCategory[];
  accountId?: string;
  taxRateId?: string;
  merchant: string;
  note: string;
  netAmount: number;
  taxAmount: number;
  sync?: boolean;
  attachment?: File;
}

export interface TrackingCategory {
  id: string;
  label: string;
}