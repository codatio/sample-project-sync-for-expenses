import { ExpenseItem } from "@/data/expenseItem";
import Decimal from "decimal.js";
import { useRouter } from "next/router";
import React, { Dispatch, FormEvent, SetStateAction, useEffect, useState } from "react";
import styles from './styles.module.css';

const ListExpenses = ({
  expenses,
  setExpenses,
}: {
  expenses: ExpenseItem[];
  setExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
}) => {
  const router = useRouter();
  const companyId = router.query.id as string;

  const onClick = async (
    event: React.MouseEvent,
    companyId: string,
    expenseId: string
  ) => {
    event.preventDefault();
    await router.push(
      "/companies/[id]/expenses/[expenseId]/edit-expense",
      `/companies/${companyId}/expenses/${expenseId}/edit-expense`
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const expensesToSync: ExpenseItem[] = expenses.filter((e) => e.sync);
    const response = await fetch(`/api/companies/${companyId}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expensesToSync),
    });
    const syncId = (await response.json()).syncId as string;
    await router.push("/companies/[id]/syncs/[syncId]/result", `/companies/${companyId}/syncs/${syncId}/result`);
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
      expense.categories.length > 0 &&
      expense.taxRateId !== undefined
    );
  };

  return (
    <main>
      <div className="flex-container">
        <h1>Expenses</h1>
        <form onSubmit={onSubmit}>
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Description</th>
                <th>Categories</th>
                <th>Note</th>
                <th>Receipt attached</th>
                <th>Total</th>
                <th>Sync?</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item, index) => (
                <tr key={index}>
                  <td>{item.employeeName}</td>
                  <td>{item.description}</td>
                  <td>{item.categories.map((c) => c.label).join(", ")}</td>
                  <td>{item.note}</td>
                  <td>
                    <input
                      type="checkbox"
                      id={`receiptAttached${index}`}
                      name={`receiptAttached${index}`}
                      value="receipt"
                      disabled={true}
                    />
                  </td>
                  <td>
                    {Decimal.add(item.netAmount, item.taxAmount).toNumber()}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      id={`ready${index}`}
                      name={`ready${index}`}
                      value="ready"
                      checked={item.sync || false}
                      onChange={() => onSetItemToSync(index)}
                      disabled={!canBeSynced(item)}
                    />
                  </td>
                  <td>
                    <button
                      onClick={(event) => onClick(event, companyId, item.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="submit">Sync</button>
        </form>
      </div>
    </main>
  );
};

export default ListExpenses;
