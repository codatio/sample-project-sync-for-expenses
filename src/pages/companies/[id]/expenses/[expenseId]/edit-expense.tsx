import { Dispatch, FormEvent, SetStateAction } from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";

import { ExpenseItem } from "@/data/expenseItem";
import { CodatSyncExpenses } from "@codat/sync-for-expenses";
import { MappingOptions } from "@codat/sync-for-expenses/dist/sdk/models/shared";

import styles from './styles.module.scss';

interface SelectOption {
  label: string;
  value: string;
}

const syncForExpensesApi = new CodatSyncExpenses({
  security: {
    authHeader: process.env.CODAT_AUTH_HEADER as string,
  },
});

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { id: companyId } = context.query;

  const mappingOptions =
    await syncForExpensesApi.mappingOptions.getMappingOptions({
      companyId: companyId as string,
    });

  if (mappingOptions.statusCode !== 200) {
    console.log("Failed to get mapping options", mappingOptions.rawResponse);
    console.log(
      Buffer.from(mappingOptions.rawResponse?.data, "binary").toString("utf8")
    );
    throw new Error("Unable to get mapping options");
  }

  return {
    props: {
      // https://github.com/vercel/next.js/issues/11993
      mappingOptions: JSON.parse(JSON.stringify(mappingOptions.mappingOptions)),
    },
  };
};

const EditExpense = ({
  expenses,
  mappingOptions,
  setExpenses,
}: {
  expenses: ExpenseItem[];
  mappingOptions: MappingOptions;
  setExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
}) => {
  const router = useRouter();
  const transactionId = router.query.expenseId as string;
  const companyId = router.query.id as string;
  const expenseTransaction = expenses.find(
    (transaction) => transaction.id === transactionId
  )!;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const trackingCategories = formData.getAll("trackingCategories");
    const taxRate = formData.get("taxRate");
    const account = formData.get("account");
    const attachment = formData.get("attachment");

    setExpenses((s) =>
      s.map((e) => {
        const sync = trackingCategories.length > 0;
        return e.id === transactionId
          ? {
              ...e,
              sync,
              accountId: account!.valueOf().toString(),
              taxRateId: taxRate!.valueOf().toString(),
              categories: trackingCategories.map((tc) => {
                const cat = mappingOptions.trackingCategories!.find(
                  (x) => x.id === tc!.valueOf().toString()
                );

                return {
                  id: tc!.valueOf().toString(),
                  label: cat!.name!,
                };
              }),
            }
          : e
      }
      )
    );

    await router.push(
      "/companies/[id]/list-expenses",
      `/companies/${companyId}/list-expenses`
    );
  };

  console.log(mappingOptions)

  return (
    <div className={styles.card}>
      <h1>{`${expenseTransaction!.employeeName} ${
        expenseTransaction!.description
      }`}</h1>

      <form onSubmit={onSubmit}>
        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="trackingCategories">Tracking categories</label>
          <select multiple id="trackingCategories" name="trackingCategories" className={styles.trackingCategories}>
            {mappingOptions.trackingCategories!.map((category) => (
              <option
                key={category.id!}
                value={category.id}
                selected={
                  expenseTransaction.categories.find(
                    (x) => x.id === category.id
                  ) !== undefined
                }
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="taxRate">Tax rate</label>
          <select id="taxRate" name="taxRate">
            {mappingOptions.taxRates!.map((taxRate) => (
              <option
                key={taxRate.id}
                value={taxRate.id}
                selected={taxRate.id === expenseTransaction?.taxRateId}
              >
                {taxRate.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="account">Account</label>
          <select id="account" name="account">
            {mappingOptions.accounts!.map((account) => (
              <option
                key={account.id}
                value={account.id}
                selected={account.id === expenseTransaction.accountId}
              >
                {`${account.name} (${account.accountType})`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label className={styles.inputLabel} htmlFor="attachment">Upload an attachment</label>
          <input
            type="file"
            id="attachment"
            name="attachment"
            disabled={true}
          />
        </div>

        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default EditExpense;
