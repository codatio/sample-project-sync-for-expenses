import { NextApiRequest, NextApiResponse } from "next";
import { DataTypeNames } from "../../webhooks";
import { CodatAccounting } from "@codat/accounting";
import { CodatCommon } from "@codat/common";
import { SourceType } from "@codat/common/dist/sdk/models/shared";
import { repository } from "../../repository";
import {
  CustomerStatus,
  SupplierStatus,
} from "@codat/accounting/dist/sdk/models/shared";

const accountingApi = new CodatAccounting({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

const codatApi = new CodatCommon({
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
  const { id } = query;
  if (typeof id !== "string") {
    res.status(400).end();
    return;
  }

  const allDataTypes = [
    DataTypeNames.Accounts,
    DataTypeNames.Customers,
    DataTypeNames.Suppliers,
  ];

  let allDataTypesFound = true;
  await Promise.all(
    allDataTypes.map(async (dataType) => {
      const completedOperations = await repository.completedPullOperations.get(id, dataType)
      console.log(id)
      console.log(dataType)
      console.log(completedOperations)
      if (completedOperations == undefined) {
        console.log(`Datatype not found: ${dataType}`);
        allDataTypesFound = false;
      }
    })
  );
  if (!allDataTypesFound) {
    res.status(404).end();
    return;
  }

  const connectionsResponse = await codatApi.connections.list({
    companyId: id,
  });
  const accountingConnection = connectionsResponse.connections?.results?.find(
    (c) => c.sourceType === SourceType.Accounting
  );
  if (accountingConnection === undefined) {
    throw new Error("Unable to find accounting connection");
  }

  const company = await codatApi.companies.get({ companyId: id });

  const bankAccountResponse = await accountingApi.accounts.list({
    companyId: id,
  });

  const suppliersResponse = await accountingApi.suppliers.list({
    companyId: id,
  });

  const customersResponse = await accountingApi.customers.list({
    companyId: id,
  });

  res.status(200).json({
    bankAccounts:
        (bankAccountResponse.accounts?.results || [])
            .filter((acc) => acc.isBankAccount === true)
            .map((acc) => ({
              label: `(${acc.currency})${acc.name}`,
              value: acc.id,
            })),
    companyName: company.company!.name,
    customers:
      customersResponse.customers?.results
        ?.filter((c) => c.status === CustomerStatus.Active)
        .map((c) => ({
          label: c.customerName || c.contactName,
          value: c.id,
        })) || [],
    suppliers:
      suppliersResponse.suppliers?.results
        ?.filter((s) => s.status === SupplierStatus.Active)
        .map((s) => ({
          label: s.supplierName || s.contactName,
          value: s.id,
        })) || [],
  } as CompanyConfigData);
}
