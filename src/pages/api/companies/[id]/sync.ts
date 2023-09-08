import { ExpenseItem } from "@/data/expenseItem";
import { CreateExpenseDatasetRequest } from "@codat/sync-for-expenses/dist/sdk/models/operations";
import {
  ExpenseTransaction,
  ExpenseTransactionType,
} from "@codat/sync-for-expenses/dist/sdk/models/shared";
import { NextApiRequest, NextApiResponse } from "next";
import { CodatSyncExpenses } from "@codat/sync-for-expenses";

const syncForExpensesApi = new CodatSyncExpenses({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const companyId = query.id as string;

  const body = req.body as ExpenseItem[];

  if (method !== "POST") {
    res.status(405).json({ error: "Invalid method" });
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // Months are 0-based, so +1 is needed
  const day = today.getDate();

  const formattedDate = `${year}-${month}-${day}`;

  const request: CreateExpenseDatasetRequest = {
    companyId,
    createExpenseRequest: {
      items: body.map((x) => {
        return {
          currency: "GBP",
          issueDate: formattedDate,
          id: x.id,
          contactRef: x.contactRef,
          type: x.type,
          notes: x.note,
          merchantName: "Merchant name",
          lines: [
            {
              accountRef: { id: x.accountId! },
              netAmount: x.netAmount,
              taxAmount: x.taxAmount,
              taxRateRef: { id: x.taxRateId! },
              trackingRefs: x.categories.map((c) => ({ id: c.id })),
            },
          ],
        };
      }),
    },
  };

  console.log(request.createExpenseRequest?.items?.map((x) => x.lines));

  const result = await syncForExpensesApi.expenses.createExpenseDataset(
    request
  );
  if (result.statusCode !== 200) {
    console.log("Failed to create dataset", result.rawResponse);
    console.log(
      Buffer.from(result.rawResponse?.data, "binary").toString("utf8")
    );
    res.status(500).end();
    return;
  }
  const datasetId = result.createExpenseResponse!.datasetId!;

  const createSyncResult = await syncForExpensesApi.sync.intiateSync({
    companyId: companyId,
    postSync: {
      datasetIds: [datasetId],
    },
  });

  if (createSyncResult.statusCode !== 202) {
    console.log("Failed to initiate sync", createSyncResult.rawResponse);
    console.log(
      Buffer.from(createSyncResult.rawResponse?.data, "binary").toString("utf8")
    );
    res.status(500).end();
    return;
  }

  res.status(200).json({
    syncId: createSyncResult.syncInitiated?.syncId!,
  });
}
