export interface ExpenseItem {
  id: string;
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