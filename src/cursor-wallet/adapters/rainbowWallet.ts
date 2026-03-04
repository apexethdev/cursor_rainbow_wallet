import type { Wallet } from "@rainbow-me/rainbowkit";
import { createConnector } from "wagmi";

import { createCursorWalletConnector } from "../core/connector";
import type { CreateCursorWalletOptions } from "../types";

const CURSOR_WALLET_ICON =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='24' fill='%230b1220'/%3E%3Ccircle cx='64' cy='64' r='29' fill='%2360a5fa'/%3E%3Cpath d='M40 64h48M64 40v48' stroke='%230b1220' stroke-width='8' stroke-linecap='round'/%3E%3C/svg%3E";

export const createCursorWalletRainbowWallet = (options: CreateCursorWalletOptions) => {
  const walletName = options.walletName ?? "Cursor Wallet";
  const enabled = options.enabled ?? true;

  return (): Wallet => ({
    id: "cursorWallet",
    name: walletName,
    shortName: walletName,
    iconUrl: CURSOR_WALLET_ICON,
    iconBackground: "#0b1220",
    installed: true,
    hidden: () => !enabled,
    createConnector: (walletDetails) =>
      createConnector((config) => ({
        ...createCursorWalletConnector(options)(config),
        ...walletDetails,
      })),
  });
};
