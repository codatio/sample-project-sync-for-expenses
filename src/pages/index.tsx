import { FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

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
        <title>Step 1 | Sync for Expenses starter project</title>
      </Head>
      <main>
        <div className="flex-container">
          <h1>Create a company</h1>

          <form onSubmit={onSubmit}>
            <label htmlFor="companyName">Company name</label>
            <input type="text" id="companyName" name="companyName" />

            <button type="submit">Link my accounting package</button>
          </form>
        </div>
      </main>
    </>
  );
}

export default Home;
