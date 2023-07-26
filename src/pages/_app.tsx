import { Dispatch, SetStateAction, useState } from "react";
import { AppProps } from "next/app";

import { ExpenseItem } from "@/data/expenseItem";
import { dummyData } from "@/data/dummyData";

import "../../styles/globals.css";
import styles from "./styles.module.scss";

interface IntegrationDemoProps {
  expenses: ExpenseItem[];
  setExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
}

function MyApp({ Component, pageProps }: AppProps & IntegrationDemoProps) {
  const [expenses, setExpenses] = useState(dummyData);

  return (
    <main>
      <div className={styles.container}>
          <Component
            expenses={expenses}
            setExpenses={setExpenses}
            {...pageProps}
          />
      </div>
    </main>
  );
}

export default MyApp;
