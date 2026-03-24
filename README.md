# Stabilee

Web app for **Stabilee** — stablecoin wallet flows: balances, send, bulk send, receive, and transaction history (Activity) on **Base** and **Ethereum** (testnets and mainnets), with Supabase and Alchemy integration.

## Tech stack

- Vite · TypeScript · React · React Router  
- Tailwind CSS · shadcn/ui  
- Supabase · Alchemy SDK · ethers  

## Local development

Requires **Node.js** and **npm**.

```sh
npm install
npm run dev
```

The dev server defaults to port **8080** (see `vite.config.ts`).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Environment

Configure Supabase, Alchemy, and RPC URLs via your `.env` / deployment secrets (see `src/hooks/supabaseClient.ts`, `src/lib/alchemy.ts`, and env vars referenced in the app).

## Deploy

Build with `npm run build` and host the `dist` output on your static host or CDN.
