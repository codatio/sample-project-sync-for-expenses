import { NextApiRequest, NextApiResponse } from "next";
import { CodatSyncExpenses } from "@codat/sync-for-expenses";

export interface SaveCompanyConfigRequest {
  supplierId: string;
  customerId: string;
  bankAccountId: string
}

const syncForExpensesApi = new CodatSyncExpenses({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

const saveConfig = async (companyId: string, request: SaveCompanyConfigRequest) => {
  const updateConfigResponse =
    await syncForExpensesApi.configuration.saveCompanyConfiguration({
      companyId,
      companyConfiguration: {
        bankAccount: {
          id: request.bankAccountId
        },
        customer: {
          id: request.customerId
        },
        supplier: {
          id: request.supplierId
        }
      }
    });

  if (updateConfigResponse.statusCode !== 200) {
    console.log(Buffer.from(updateConfigResponse.rawResponse?.data, 'binary').toString('utf8'));
    throw new Error("Failed to save company configuration");
  }

  return {
    config: updateConfigResponse.companyConfiguration,
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const body = req.body as SaveCompanyConfigRequest;
  console.log(body);

  if (method !== "POST") {
    res.status(405).json({ error: "Invalid method" });
    return;
  }

  const saveConfigResult = await saveConfig(query.id as string, body);

  res.status(200).json({
    config: saveConfigResult.config,
  });
}
