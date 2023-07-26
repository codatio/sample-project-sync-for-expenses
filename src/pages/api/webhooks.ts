import { NextApiRequest, NextApiResponse } from "next";
import {completedPullOperations, syncOutcomes} from './repository';

interface Webhook {
  AlertId: string;
  ClientId: string;
  ClientName: string;
  CompanyId: string;
  Message: string;
  RuleId: string;
  RuleType: string;
  Data: SyncWebhookData | DataSyncCompletedWebhookData;
}

interface SyncWebhookData {
  syncId: string;
  syncType: string;
  syncDateRangeStartUtc: string;
  syncDateRangeFinishUtc: string;
}

interface DataSyncCompletedWebhookData {
  dataType: string;
  datasetId: string;
}

function webhookDataIsSyncWebhook(
  data: SyncWebhookData | DataSyncCompletedWebhookData
): data is SyncWebhookData {
  return (data as SyncWebhookData)?.syncId !== undefined;
}

function webhookDataIsDataSyncCompleted(
  data: SyncWebhookData | DataSyncCompletedWebhookData
): data is DataSyncCompletedWebhookData {
  return (data as DataSyncCompletedWebhookData)?.datasetId !== undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  const webhookPayload = body as Webhook;

  console.log("Webhook received", webhookPayload);

  if (webhookDataIsDataSyncCompleted(webhookPayload.Data)) {
    const dataType = webhookPayload.Data.dataType;
    console.log("storing " + dataType);
    await completedPullOperations.add({companyId: webhookPayload.CompanyId, completedAt: new Date(), dataType});
  }
  
  if (webhookDataIsSyncWebhook(webhookPayload.Data)) {
    await syncOutcomes.add({
      companyId: webhookPayload.CompanyId,
      syncId: webhookPayload.Data.syncId,
      result: webhookPayload.RuleType === WebhookNames.SyncCompleted
      ? "success"
      : "failure"
    })
  }

  res.status(200).end();
}

export enum WebhookNames {
  SyncCompleted = "Sync Completed",
  SyncFailed = "Sync Failed",
  DataSyncCompleted = "Data sync completed",
}

export enum DataTypeNames {
  Customers = "customers",
  Suppliers = "suppliers",
  BankAccounts = "bankAccounts",
}