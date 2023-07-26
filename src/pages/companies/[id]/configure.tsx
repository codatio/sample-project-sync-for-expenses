import { SaveCompanyConfigRequest } from "@/pages/api/companies/[id]/config";
import { CompanyConfigData } from "@/pages/api/companies/[id]/config-options";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useRef, useState } from "react"

function Configure() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const request: SaveCompanyConfigRequest = {
      supplierId: formData.get("defaultSupplier")!.toString(),
      customerId: formData.get("defaultCustomer")!.toString(),
      bankAccountId: formData.get("defaultBankAccount")!.toString(),
    };

    const response = await fetch(`/api/companies/${id}/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status !== 200) {
      throw new Error("Unable to save config");
    } else {
      await router.push('/companies/[id]/list-expenses', `/companies/${id}/list-expenses`);
    }
  };

  const getData = async (companyId: string) => {
    const response = await fetch(`/api/companies/${companyId}/config-options`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status !== 200) {
      throw new Error("Unable to get company data");
    }

    const data = await response.json();
    return data as CompanyConfigData;
  };

  const [companyConfigData, setCompanyData] = useState<CompanyConfigData>();
  const timeoutRef = useRef<number>();

  useEffect(() => {
    async function getCompanyData() {
      if (id === undefined) {
        return;
      }

      const data = await getData(id);
      console.log(data)
      if (data === null) {
        timeoutRef.current = window.setTimeout(() => getCompanyData(), 1000);
        return;
      }

      setCompanyData(data);
    }

    getCompanyData();
    return () => clearTimeout(timeoutRef.current);
  }, [id]);

  if (!companyConfigData) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <div className="flex-container">
        <h1>{companyConfigData.companyName}: Set up</h1>
        <p>
          Your accounting package is all connected! Now set up your company
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="defaultSupplier">Default Supplier</label>
          <select id="defaultSupplier" name="defaultSupplier">
            {companyConfigData.suppliers.map((supplier) => (
              <option key={supplier.label} value={supplier.value}>
                {supplier.label}
              </option>
            ))}
          </select>

          <label htmlFor="defaultCustomer">Default Customer</label>
          <select id="defaultCustomer" name="defaultCustomer">
            {companyConfigData.customers.map((customer) => (
              <option key={customer.label} value={customer.value}>
                {customer.label}
              </option>
            ))}
          </select>

          <label htmlFor="defaultBankAccount">Default Bank Account</label>
          <select id="defaultBankAccount" name="defaultBankAccount">
            {companyConfigData.bankAccounts.map((account) => (
              <option key={account.label} value={account.value}>
                {account.label}
              </option>
            ))}
          </select>

          <button type="submit">Continue</button>
        </form>
      </div>
    </main>
  );
}

export default Configure;
