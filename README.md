# Cursor Wallet Demo

A standalone Next.js 16 demo app that shows how to run a dev wallet inside Cursor browser preview mode using RainbowKit + Wagmi.

`Cursor Wallet` simulates extension-wallet flows (connect, sign, switch chain, send tx) so you can test wallet UX in environments where browser extensions are unavailable.

## Stack

- Next.js 16 (App Router, TypeScript)
- RainbowKit 2
- Wagmi 2
- Viem 2
- Base Sepolia chain configuration

## Quickstart

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Add a development-only private key in `.env.local`:

```bash
NEXT_PUBLIC_DEV_WALLET_ENABLED=true
NEXT_PUBLIC_DEV_WALLET_PRIVATE_KEY=0x...
```

4. Start dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000), then use **Connect Wallet** and pick **Cursor Wallet**.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint project
- `npm run typecheck` - run TypeScript checks

## Cursor Preview Workflow

1. Run this app locally.
2. Open the app in Cursor browser preview.
3. Connect with `Cursor Wallet`.
4. Trigger demo actions:
   - Sign message
   - Request chain switch
   - Send self transaction
5. Approve or reject each request via the Cursor Wallet modal.

## Supported Wallet RPC Methods

- `eth_requestAccounts`
- `eth_accounts`
- `eth_chainId`
- `personal_sign`
- `eth_sign`
- `eth_signTypedData_v4`
- `eth_sendTransaction`
- `wallet_switchEthereumChain`

## Security Notes

- This wallet is for local development only.
- Never use production keys or wallets with meaningful funds.
- Keep `NEXT_PUBLIC_DEV_WALLET_ENABLED` disabled outside localhost development.

## Notes on Dependency Versions

RainbowKit 2 currently peers on Wagmi 2, so this demo uses Wagmi 2 for a stable compatible setup.
