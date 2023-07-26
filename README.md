# sample-project-sync-for-expenses

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodatio%2Fsample-project-sync-for-expenses&env=CODAT_AUTH_HEADER,CODAT_RECEIVE_WEBHOOK_BASE_URL&envDescription=Your%20Codat%20Auth%20Header,The%20base%20%20url%20this%20project%20is%20deployed%20at&envLink=https%3A%2F%2Fdocs.codat.io%2Freference%2Fauthentication)

Sync for Expenses is an API and a set of supporting tools. It has been built to enable corporate card and expense management platforms to provide high-quality integrations with multiple accounting platforms through a standardized API.

This sample project implements setting a company up for expense sync.

## Prerequisites

- [Sign up](https://signup.codat.io/)!
- Enable Sync for Expenses
- Configure your [data type settings](https://docs.codat.io/sync-for-expenses/gettingstarted#data-types)
- Ensure our [accounting](https://app.codat.io/settings/integrations/accounting/manage/mqjo?integrationName=Sandbox) and [commerce](https://app.codat.io/settings/integrations/commerce/manage/aiwb?integrationName=Commerce%20Sandbox) sandbox integrations are enabled. You can disable [Banking Sandbox](https://app.codat.io/settings/integrations/banking/manage/qhnd?integrationName=Banking%20Sandbox). **Sandbox syncs will fail.**


For the full experience, enable a non-Codat sandbox integration (e.g. [QuickBook Online Sandbox](https://docs.codat.io/integrations/accounting/quickbooksonline/accounting-quickbooksonline-new-setup#create-a-quickbooks-online-app-configured-for-sandbox))

For more information, follow the [Sync for Expenses getting started guide](https://docs.codat.io/sync-for-expenses/gettingstarted).

## Getting started locally

### 1. Create a local env file

- Copy the `.env.example` file into a `.env.local` file

### 2. Set your Codat auth header

- Set the `CODAT_AUTH_HEADER` to your [authorization header](https://docs.codat.io/using-the-api/authentication).

### 3. Webhooks - Open up a local tunnel

This demo relies on webhooks that signal when a sync has completed successfully (or failed). To allow Codat's webhooks to hit this demo app, you'll need to open up a local tunnel. We recommend using [localtunnel](https://theboroer.github.io/localtunnel-www/):

- Run `localtunnel`

```
npx localtunnel --port 3000
```

- Extract the URL. It should look like https://some-subdomain.loca.lt
- Set the `CODAT_RECEIVE_WEBHOOK_BASE_URL` to this URL. The `.env.local` file will need updating with this value.

### 4. Run the development server

Install dependencies

```bash
npm install
```

then start the server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Implementation details

- We've taken care of creating new webhook rules for each company you add - instead of this, you can just create the rules once, listening for all companies.
- We've used [Embedded Link](https://docs.codat.io/auth-flow/authorize-embedded-link) for the authorization of access to the data.
- This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Deploying the project

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Webhooks

Unlike locally you don't need to setup anything extra to handle the webhooks. Just make sure you've set the environment variable `CODAT_RECEIVE_WEBHOOK_BASE_URL` correctly (excluding the `/api/webhooks` path).

E.g. `https://sample-project-sync-for-expenses.vercel.app`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Pitfalls

- If you're using a free trial, you may hit the [free plan limitations](https://docs.codat.io/configure/plans/free#free-plan-limitations). You won't be able to create more than 5 Sync for Expenses companies.
