# Stabliee Telegram bot

Chat-only wallet bot — same as Tresori Pay: `/login`, `/balance`, `/send`, `/wallet`.

Uses Kalp wallet API (`alpha-wallet-api.kalp.studio`) with Stabliee defaults (ETH Sepolia USDT).

## Setup

### 1. BotFather

1. [@BotFather](https://t.me/BotFather) → `/newbot` → e.g. `Stabliee Wallet` / `stabliee_wallet_bot`
2. Copy token into `stabliee-fe/.env`:

```env
TELEGRAM_BOT_TOKEN=your_token
VITE_WALLET_API_URL=https://alpha-wallet-api.kalp.studio/
VITE_WALLET_API_KEY=your_kalp_open_api_key
```

### 2. Optional Stabliee config

```env
# Chain: eth-sepolia (default) or base-sepolia
STABLIEe_BOT_CHAIN=eth-sepolia

# Stablecoin on Sepolia ETH (matches Transactions.tsx default)
VITE_STABLE_TOKEN_ADDRESS=0x5aEC77A2CBE8ee9D359F965826BdDFa026DfFb38
STABLE_TOKEN_SYMBOL=USDT

# Stabliee fee relayer (optional — user pays gas fee in token)
STABLIEe_BOT_USE_FEE_RELAYER=false
STABLIEe_FEE_RECIPIENT=0xaAEd3fCdDEDA26F9AD0582698d9Be012e48D88aF
STABLIEe_PLATFORM_FEE_PERCENT=0.01
```

### 3. Run

```bash
cd stabliee-fe
npm run bot:install
npm run bot:dev
```

Reset menu (no Mini App):

```bash
npm run bot:reset-menu
```

### 4. Test in Telegram

`/start` → `/login` → phone → OTP → `/balance` → `/send`

## Commands

| Command | Action |
|---------|--------|
| `/start` | Welcome |
| `/login` | Phone OTP |
| `/balance` | ETH + USDT |
| `/send` | Gasless transfer |
| `/wallet` | Address |
| `/logout` | Clear session |

Sessions are in-memory on the bot process — restart requires `/login` again.
