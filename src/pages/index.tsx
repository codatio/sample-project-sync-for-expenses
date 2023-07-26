import { FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import styles from "./styles.module.scss";

interface CreateCompanyResponse {
  id: string;
  redirect: string;
}

function Home() {
  const router = useRouter();

  const onSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const companyName = formData.get("companyName");
  
    if (companyName == "") {
      throw new Error("Enter a company name");
    }

    const response = await fetch("/api/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyName }),
    });
  
    if (response.status !== 201) {
      throw new Error("Failed to create company");
    }
  
    const responseBody = (await response.json()) as CreateCompanyResponse;
    if (!responseBody.redirect) {
      throw new Error("Redirect URL not provided");
    }

    await router.push(responseBody.redirect);
  };

  return (
    <>
      <Head>
        <title>starter-project-sync-for-commerce</title>
      </Head>
      <div className={styles.card}>
        <h1 className={styles.header}>Sync a company</h1>

        <form onSubmit={onSubmit}>
          <div className={styles.formRow}>
            <label htmlFor="companyName">Company name</label>
            <input className={styles.input} type="text" id="companyName" name="companyName" />
          </div>

          <button type="submit">Authorize access</button>
        </form>
      </div>
    </>
  );
}

export default Home;
