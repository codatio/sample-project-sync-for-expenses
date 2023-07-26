# sample-project-sync-for-expenses

## Prerequisites

Follow the [Sync for Expenses getting started guide](https://docs.codat.io/sync-for-expenses/gettingstarted):

- Enable Sync for Expenses
- Configure your data type settings
- Enable an integration (e.g. [QuickBook Online Sandbox](https://docs.codat.io/integrations/accounting/quickbooksonline/accounting-quickbooksonline-new-setup#create-a-quickbooks-online-app-configured-for-sandbox))

## Getting Started

### 1. Create a local env file

- Copy the `.env.example` file into a `.env.local` file

### 2. Set your Codat auth header

- Set the `CODAT_AUTH_HEADER` to your [authorization header](https://docs.codat.io/using-the-api/authentication).

### 3. Open up a local tunnel

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
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
