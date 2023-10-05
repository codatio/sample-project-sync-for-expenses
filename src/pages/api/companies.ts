import { CodatCommon } from "@codat/common";
import { CreateRule } from "@codat/common/dist/sdk/models/shared";
import { CodatSyncExpenses } from "@codat/sync-for-expenses";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
const webhookUrl = `${process.env.CODAT_RECEIVE_WEBHOOK_BASE_URL}/api/webhooks`;

const codatApi = new CodatCommon({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

const expenseApi = new CodatSyncExpenses({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

const createCompany = async (companyName: string) => {
  const response = await codatApi.companies.create({
    name: companyName,
  });

  if (response.statusCode == 402) {
    throw new Error("Free trial limits hit. Please delete a company.");
  }

  if (response.statusCode !== 200) {
    throw new Error("Failed to create company");
  }

  return { companyId: response.company!.id, redirect: response.company!.redirect };
};

const createPartnerExpenseConnection = async (companyId: string) => {
  const response = await expenseApi.connections.createPartnerExpenseConnection({
    companyId,
  });

  if (response.statusCode == 402) {
    throw new Error("Free trial limits hit. Please delete a connection.");
  }

  if (response.statusCode !== 200) {
    throw new Error("Failed to create partner expense connection");
  }

  console.log("connection", response.connection);

  return { connectionId: response.connection!.id };
};

const createWebhooks = async (companyId: string) => {
  const syncCompletedResponse = codatApi.webhooks.create({
    companyId: companyId,
    type: "sync-complete",
    notifiers: { webhook: webhookUrl },
  });

  const syncFailedResponse = codatApi.webhooks.create({
    companyId: companyId,
    type: "sync-failed",
    notifiers: { webhook: webhookUrl },
  });

  const datasetStatusChangeResponse = codatApi.webhooks.create({
    companyId: companyId,
    type: "Data sync completed",
    notifiers: { webhook: webhookUrl },
  });

  const responses = await Promise.all([syncCompletedResponse, syncFailedResponse, datasetStatusChangeResponse]);

  if (responses.some(r => r.statusCode !== 200)) {
    throw new Error("Failed to create webhook");
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  if (method !== "POST") {
    res.status(405).json({ error: "Invalid method" });
    return;
  }

  const { companyName } = body;

  const createCompanyResult = await createCompany(companyName);

  await createPartnerExpenseConnection(createCompanyResult.companyId);
  await createWebhooks(createCompanyResult.companyId);

  res.status(201).json({ id: createCompanyResult.companyId, redirect: createCompanyResult.redirect });
}
