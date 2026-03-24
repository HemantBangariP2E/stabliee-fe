# Stabilee Frontend — Interview Recap (One Page)

## Elevator pitch (30 sec)
Built and refined a **React + TypeScript** web app for a **stablecoin wallet**: balances, send/bulk send, and **Activity** that combines **Supabase** (app-recorded txs) with **Alchemy** (on-chain ERC-20 transfers) across **Base & Ethereum** (testnets + mainnets), with correct **multi-recipient bulk** handling and **post-send refresh** without manual reload.

---

## What I shipped / owned

### Multi-chain & on-chain data
- Integrated **Alchemy SDK** for ERC-20 **sent/received** totals and historical transfers; mapped **chainId → network + token contract** (Sepolia, Base Sepolia, ETH/Base mainnet).
- Handled **pagination**, **amount parsing**, **in-memory cache** with invalidation, **refetch on chain change** (`chainChanged`).
- **Explorer URLs** branch by chain (Etherscan / Basescan, mainnet vs testnet).

### Transaction history (“Activity”)
- **Merged** Supabase `transactions` + Alchemy transfers; **deduplicated** by **`tx_hash + recipient`** so **bulk sends** (one hash, many recipients) show **one row per recipient**, not one row total.
- **Send vs receive** from the **logged-in user’s** view using `owner_address` / `to_address`, not DB `direction` alone.
- **Network-scoped** list via **`chain_id`** filter so users don’t see other networks’ rows.
- **Filtered platform fee legs** (transfers to known fee wallets) so the UI shows the **main transfer**, not the fee leg as a duplicate line.
- **Case-insensitive** address matching (`.ilike`) for consistency across wallets and DB.

### Reliability after send
- Navigation to Activity passes **router state** + uses **`location.key`** so the list **refetches** on entry.
- **Delayed background refetches** after send to absorb **indexer / DB replication lag** (no full-page reload).

### Dashboard
- **Send / receive** stats from **on-chain totals** (Alchemy) aligned with the **same token addresses** as RPC **balance** reads where applicable.
- Refetch when **network** or **wallet context** changes.

### Bulk send & CSV
- **CSV validation** (e.g. USDC-only where required), defaults for missing currency.
- **Bulk DB inserts**: one row per recipient, shared **`tx_hash`** where the chain uses one transaction, **`chain_id`** on each row.

### App shell
- **Wallet redirect** route for post-login / callback flows.
- **Logout** via **`navigate(..., { replace: true })`** instead of hard reload where appropriate.

---

## Technical talking points (use in interview)

| Topic | What to say |
|--------|-------------|
| **Why two data sources?** | DB has business metadata (emails, status); chain has truth for anything not synced or external wallets. |
| **Bulk + same tx hash** | Can’t key only by `tx_hash`; use **`hash + to_address`** (or equivalent) so every recipient appears once. |
| **Fee transfer** | Same tx can include user→recipient and user→fee; filter **to = fee wallet** for display/totals so we don’t double the story. |
| **Stale list after send** | Combine **navigation remount**, **clear cache**, and **delayed refetch** for indexer lag. |

---

## Stack (keywords for ATS / recruiters)
React · TypeScript · Vite · React Router · Supabase · Alchemy · Ethers · ERC-20 · multi-chain · Base · Ethereum

---

## One closing line
*“I focused on correctness at the boundary between product database and blockchain: merging sources, chain-aware filtering, bulk edge cases, and refresh behavior so the UI matches what users expect after they send.”*
