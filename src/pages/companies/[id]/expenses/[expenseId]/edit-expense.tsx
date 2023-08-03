import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";

import { ExpenseItem } from "@/data/expenseItem";
import { CodatSyncExpenses } from "@codat/sync-for-expenses";
import { ExpenseTransactionType, MappingOptions } from "@codat/sync-for-expenses/dist/sdk/models/shared";

import styles from "./styles.module.scss";
import { CodatAccounting } from "@codat/accounting";
import { Supplier } from "@codat/accounting/dist/sdk/models/shared";

interface SelectOption {
  label: string;
  value: string;
}

const isSupplierApplicable = (transaction: ExpenseItem): boolean => {
  // For QBO, suppliers are only applicable for the Payment transaction type
  return transaction.type == ExpenseTransactionType.Payment;
};

const syncForExpensesApi = new CodatSyncExpenses({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

const accountingApi = new CodatAccounting({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { id: companyId } = context.query;

  const mappingOptionsResponse =
    await syncForExpensesApi.mappingOptions.getMappingOptions({
      companyId: companyId as string,
    });

  if (mappingOptionsResponse.statusCode !== 200) {
    console.log("Failed to get mapping options", mappingOptionsResponse.rawResponse);
    console.log(
      Buffer.from(mappingOptionsResponse.rawResponse?.data, "binary").toString("utf8")
    );
    throw new Error("Unable to get mapping options");
  }

  // TODO: Handle paging
  const suppliersResponse =
    await accountingApi.suppliers.list({
      companyId: companyId as string,
      query: "status=active"
    });

  if (suppliersResponse.statusCode !== 200) {
    console.log("Failed to get suppliers", suppliersResponse.rawResponse);
    console.log(
      Buffer.from(suppliersResponse.rawResponse?.data, "binary").toString("utf8")
    );
    throw new Error("Unable to get suppliers");
  }

  return {
    props: {
      // https://github.com/vercel/next.js/issues/11993
      mappingOptions: JSON.parse(JSON.stringify(mappingOptionsResponse.mappingOptions)),
      suppliers: JSON.parse(JSON.stringify(suppliersResponse.suppliers?.results))
    },
  };
};

const EditExpense = ({
  expenses,
  mappingOptions,
  suppliers,
  setExpenses,
}: {
  expenses: ExpenseItem[];
  mappingOptions: MappingOptions;
  suppliers: Supplier[];
  setExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
}) => {
  const router = useRouter();
  const transactionId = router.query.expenseId as string;
  const companyId = router.query.id as string;
  const expenseTransaction = expenses.find(
    (transaction) => transaction.id === transactionId
  )!;
  const [disabled, setDisabled] = useState(false);

  const onAttachmentRemoved = () => {
    setExpenses((s) =>
      s.map((expense) =>
        expense.id === transactionId
          ? {
              ...expense,
              attachment: undefined,
            }
          : expense
      )
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisabled(true);
    const formData = new FormData(event.currentTarget);
    const trackingCategoriesInput = formData.getAll("trackingCategories");
    const taxRateInput = formData.get("taxRate");
    const accountInput = formData.get("account");
    let attachment: File | undefined = undefined;
    if (expenseTransaction.attachment !== undefined) {
      attachment = expenseTransaction.attachment;
    } else {
      const attachmentInput = formData.get("attachment") as File;
      if (attachmentInput.size > 0) {
        attachment = attachmentInput;
      }
    }

    setExpenses((s) =>
      s.map((expense) => {
        const sync =
          taxRateInput!.valueOf().toString() !== undefined &&
          accountInput!.valueOf().toString() !== undefined;
        return expense.id === transactionId
          ? {
              ...expense,
              sync,
              attachment: attachment,
              accountId: accountInput!.valueOf().toString(),
              taxRateId: taxRateInput!.valueOf().toString(),
              categories: trackingCategoriesInput.map((tc) => {
                const cat = mappingOptions.trackingCategories!.find(
                  (x) => x.id === tc!.valueOf().toString()
                );

                return {
                  id: tc!.valueOf().toString(),
                  label: cat!.name!,
                };
              }),
            }
          : expense;
      })
    );

    await router.push(
      "/companies/[id]/list-expenses",
      `/companies/${companyId}/list-expenses`
    );
  };

  let selectedTrackingCategories: string[] | undefined = undefined;
  if (
    expenseTransaction.categories.length > 0 &&
    mappingOptions.trackingCategories
  ) {
    selectedTrackingCategories = mappingOptions
      .trackingCategories!.filter((x) =>
        expenseTransaction.categories.some((c) => c.id === x.id)
      )
      .map((x) => x.id!);
  }

  return (
    <div className={styles.card}>
      <h1>{`${expenseTransaction!.employeeName} ${
        expenseTransaction!.description
      }`}</h1>

      <form onSubmit={onSubmit}>
        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="trackingCategories">
            Tracking categories
          </label>
          <select
            multiple
            id="trackingCategories"
            name="trackingCategories"
            className={styles.trackingCategories}
            defaultValue={selectedTrackingCategories}
          >
            {mappingOptions.trackingCategories!.map((category) => (
              <option key={category.id!} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="taxRate">
            Tax rate
          </label>
          <select
            id="taxRate"
            name="taxRate"
            defaultValue={expenseTransaction.taxRateId}
          >
            {mappingOptions.taxRates!.map((taxRate) => (
              <option key={taxRate.id} value={taxRate.id}>
                {taxRate.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="account">
            Account
          </label>
          <select
            id="account"
            name="account"
            defaultValue={expenseTransaction.accountId}
          >
            {mappingOptions.accounts!.map((account) => (
              <option key={account.id} value={account.id}>
                {`${account.name} (${account.accountType})`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="account">Contact</label>
          <select id="account" name="account"
            disabled={
              // Ideally this would be handled in the API to avoid retrieving all of the contacts when a contact is not applicable for this transaction.
              // However, since for simplicity this demo has the transactions stored locally in the browser, we are doing this check locally.
              !isSupplierApplicable(expenseTransaction)
            }>
            {suppliers!.map((supplier) => (
              <option
                key={supplier.id}
                value={supplier.id}
                selected={supplier.id === expenseTransaction.contactRef?.id}
              >
                {`${supplier.supplierName} (${supplier.defaultCurrency})`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="attachment">
            Upload an attachment
          </label>

          {expenseTransaction.attachment === undefined && (
            <input type="file" id="attachment" name="attachment" />
          )}
          {expenseTransaction.attachment !== undefined && (
            <div>
              {expenseTransaction.attachment!.name}
              <span onClick={onAttachmentRemoved} style={{ cursor: "pointer" }}>
                &nbsp;❌
              </span>
            </div>
          )}
        </div>

        <button type="submit" disabled={disabled}>
          Save
        </button>
      </form>
    </div>
  );
};

export default EditExpense;
