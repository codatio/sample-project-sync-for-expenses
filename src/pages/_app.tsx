import { AppProps } from "next/app";
import "../../styles/globals.css";
import { ExpenseItem } from "@/data/expenseItem";
import { dummyData } from "@/data/dummyData";
import { Dispatch, SetStateAction, useState } from "react";
import styles from "./styles.module.css";

interface IntegrationDemoProps {
  expenses: ExpenseItem[];
  setExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
}

function MyApp({ Component, pageProps }: AppProps & IntegrationDemoProps) {
  const [expenses, setExpenses] = useState(dummyData);

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <Component
          expenses={expenses}
          setExpenses={setExpenses}
          {...pageProps}
        />
      </div>
    </div>
  );
}

export default MyApp;
