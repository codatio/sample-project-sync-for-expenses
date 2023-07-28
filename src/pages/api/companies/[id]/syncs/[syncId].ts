import { NextApiRequest, NextApiResponse } from "next";
import { repository } from "../../../repository";
import { CodatSyncExpenses } from "@codat/sync-for-expenses";

const syncForExpensesApi = new CodatSyncExpenses({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

export interface SelectOption {
  label: string;
  value: string;
}

export interface CompanyConfigData {
  companyName: string;
  suppliers: SelectOption[];
  customers: SelectOption[];
  bankAccounts: SelectOption[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body, query } = req;
  const { syncId, id: companyId } = query;

  if (typeof syncId !== "string" || typeof companyId !== "string") {
    res.status(400).end();
    return;
  }

  const outcome = await repository.syncOutcomes.get(syncId);
  if (outcome === undefined) {
    console.log("Sync not complete");
    res.status(404).end();
    return;
  }

  const status = await syncForExpensesApi.syncStatus.getSyncById({
    syncId: syncId,
    companyId: companyId,
  });

  const response: GetSyncResponse = {
    result: outcome.result,
    errorMessage: status.companySyncStatus?.errorMessage
  }
  res.status(200).json(response);
}

export interface GetSyncResponse {
  result: "success" | "failure";
  errorMessage?: string;
}
