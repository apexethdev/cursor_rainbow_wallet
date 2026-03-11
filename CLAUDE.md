# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start local dev server (localhost:3000)
npm run build      # production build
npm run start      # run production server
npm run lint       # lint project
npm run typecheck  # TypeScript type checking (no emit)
```

No test suite is configured.

## Environment Setup

Copy `.env.example` to `.env.local` and set:
```
NEXT_PUBLIC_DEV_WALLET_ENABLED=true
NEXT_PUBLIC_DEV_WALLET_PRIVATE_KEY=0x...  # dev-only key, never use real funds
```

## Architecture

This is a Next.js 16 (App Router) demo that simulates a browser-extension wallet for testing Web3 flows in environments where extensions are unavailable (e.g. Cursor browser preview).

**Stack**: Next.js 16, React 19, TypeScript, RainbowKit 2, Wagmi 2, Viem 2, Tailwind CSS 4, shadcn/ui, Radix UI. Only **Base Sepolia** is configured as the supported chain.

### Key Module: `/src/cursor-wallet`

This is the core reusable wallet implementation, structured as:

- **`core/connector.ts`** — Wagmi connector implementing EIP-1193 provider. Handles all RPC method dispatch (`eth_requestAccounts`, `personal_sign`, `eth_signTypedData_v4`, `eth_sendTransaction`, `wallet_switchEthereumChain`, etc.)
- **`core/approvalController.ts`** — Queue and state machine for approval requests. Exposes `waitForApproval()` which returns a promise resolved/rejected by user action.
- **`ui/CursorWalletApprovalProvider.tsx`** — React context that wires the approval controller to the UI layer.
- **`ui/CursorWalletApprovalModal.tsx`** — Modal shown to the user for each wallet action requiring approval.
- **`adapters/rainbowWallet.ts`** — RainbowKit wallet adapter wrapping the connector.
- **`env/config.ts`** — Environment variable access and validation.
- **`index.ts`** — Public API exports for the module.

### Request/Approval Flow

1. User triggers a wallet action (sign, send tx, switch chain)
2. Wagmi connector calls `approvalController.waitForApproval()`
3. The approval controller enqueues the request and updates React state
4. `CursorWalletApprovalModal` renders with approve/reject buttons
5. User decision resolves the promise; connector executes or rejects

### Supporting Code

- **`src/components/providers/Web3Provider.tsx`** — Sets up Wagmi + RainbowKit + TanStack React Query
- **`src/lib/wagmi.ts`** — Wagmi config factory
- **`src/app/page.tsx`** — Demo page with buttons to trigger wallet actions
- **`src/components/ui/`** — shadcn/ui components (button, card, badge)

### Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
