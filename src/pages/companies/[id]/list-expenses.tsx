import React, {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import Decimal from "decimal.js";
import { useRouter } from "next/router";

import { ExpenseItem } from "@/data/expenseItem";

import styles from "./styles.module.scss";

const ExpensesTable = (expenses, processing=false) => {
  return (
    <div className={styles.tableContainer}>
      <table>
        <thead>
          <tr>
            {!processing && <th>Sync?</th>}
            <th>Type</th>
            <th>Employee name</th>
            <th>Description</th>
            <th>Note</th>
            {!processing && <th>Categories</th> }
            <th>Total</th>
            <th>Receipt attached</th>
            <th>Options</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((item, i) => (
            <tr key={i}>
              {!processing && 
                <td>
                  <input
                    type="checkbox"
                    id={`ready${i}`}
                    name={`ready${i}`}
                    value="ready"
                    checked={item.sync || false}
                    onChange={() => onSetItemToSync(i)}
                    disabled={!canBeSynced(item)}
                  />
                </td>
              }
              <td>{item.type}</td>
              <td>{item.employeeName}</td>
              <td>{item.description}</td>
              <td>{item.note}</td>
              {!processing && <td>{item.categories.map((c) => c.label).join(", ")}</td>}
              <td>
                {Decimal.add(item.netAmount, item.taxAmount).toNumber()}
              </td>
              <td>
                {item.attachment === undefined && <>❌</>}
                {item.attachment !== undefined && <>✔️</>}
              </td>
              <td>
                <button
                  onClick={(event) => onClick(event, companyId, item.id)}
                  disabled = {disabled}
                >
                  {!!processing ? "Process" : "Edit" }
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ListExpenses = ({
  expenses,
  setExpenses,
}: {
  expenses: ExpenseItem[];
  setExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
}) => {
  const router = useRouter();
  const companyId = router.query.id as string;
  const [disabled, setDisabled] = useState(false);

  const onClick = async (
    event: React.MouseEvent,
    companyId: string,
    expenseId: string
  ) => {
    event.preventDefault();
    setDisabled(true);
    await router.push(
      "/companies/[id]/expenses/[expenseId]/edit-expense",
      `/companies/${companyId}/expenses/${expenseId}/edit-expense`
    );
  };

  const persistAttachmentsToBrowser = (expenses: ExpenseItem[]) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("expenseDb", 1);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore("attachments");
      };

      request.onsuccess = (event: Event) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction("attachments", "readwrite");
        const attachmentsStore = transaction.objectStore("attachments");

        for (const expense of expenses) {
          if (expense.attachment === undefined) continue;

          attachmentsStore.put({ file: expense.attachment }, expense.id);
        }

        transaction.oncomplete = () => {
          resolve();
          console.log("Transaction completed: database modification finished.");
        };

        transaction.onerror = (event) => {
          reject("An error occurred when uploading. Please try again");
        };
      };
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();   
    setDisabled(true);
    const expensesToSync: ExpenseItem[] = expenses.filter((e) => e.sync);

    if (expensesToSync.some((x) => x.attachment !== undefined)) {
      await persistAttachmentsToBrowser(
        expensesToSync.filter((x) => x.attachment !== undefined)
      );
    }

    const response = await fetch(`/api/companies/${companyId}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expensesToSync),
    });

    if (response.status !== 200) {
      setDisabled(false);
      throw new Error("Sync failed");
    }

    const syncId = (await response.json()).syncId as string;

    await router.push(
      "/companies/[id]/syncs/[syncId]/result",
      `/companies/${companyId}/syncs/${syncId}/result`
    );
  };

  const onSetItemToSync = (index: number) => {
    setExpenses((s) => {
      const updated = [...s];
      const currentItem = updated[index];
      updated[index] = { ...currentItem, sync: !currentItem.sync };

      return updated;
    });
  };

  const canBeSynced = (expense: ExpenseItem) => {
    return (
      expense.accountId !== undefined &&
      expense.taxRateId !== undefined
    );
  };

  const isSyncable = expenses.some(x => x.sync);

  return (
    <div className={styles.card}>
      <h1 className={styles.header}>Expenses</h1>

      <form onSubmit={onSubmit}>
        <h4>Expenses to process</h4>
        <ExpensesTable expenses={expenses.filter(expenses.categories?.length <= 0)} processing/>
        
        <h4>Ready to sync</h4>
        <ExpensesTable expenses={expenses.filter(expenses.categories?.length > 0)}/>
        <button disabled={!isSyncable || disabled} type="submit">Sync</button>
      </form>
    </div>
  );
};

export default ListExpenses;
