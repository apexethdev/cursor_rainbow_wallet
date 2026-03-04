import type { Hex } from "viem";

import type { CursorWalletConfig } from "../types";

const CURSOR_WALLET_NAME = "Cursor Wallet";
const CURSOR_WALLET_FLAG = "NEXT_PUBLIC_DEV_WALLET_ENABLED";
const CURSOR_WALLET_PRIVATE_KEY = "NEXT_PUBLIC_DEV_WALLET_PRIVATE_KEY";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const isHexPrivateKey = (value?: string): value is Hex =>
  !!value && /^0x[a-fA-F0-9]{64}$/.test(value);

const isLocalDevRuntime = () => {
  if (process.env.NODE_ENV !== "development") return false;
  if (typeof window === "undefined") return false;

  return LOCAL_HOSTS.has(window.location.hostname.toLowerCase());
};

export const getCursorWalletConfig = (): CursorWalletConfig => {
  const requestedEnabled = process.env.NEXT_PUBLIC_DEV_WALLET_ENABLED === "true";
  const enabled = requestedEnabled && isLocalDevRuntime();
  const rawPrivateKey = process.env.NEXT_PUBLIC_DEV_WALLET_PRIVATE_KEY?.trim();
  const hasValidPrivateKey = isHexPrivateKey(rawPrivateKey);

  if (requestedEnabled && !enabled) {
    console.warn(
      `[Cursor Wallet] ${CURSOR_WALLET_FLAG} is ignored outside localhost development runtime.`
    );
  }

  if (enabled && !hasValidPrivateKey) {
    console.warn(
      `[Cursor Wallet] ${CURSOR_WALLET_FLAG} is true but ${CURSOR_WALLET_PRIVATE_KEY} is missing or invalid. Connect will fail until a valid key is set.`
    );
  }

  return {
    enabled,
    walletName: CURSOR_WALLET_NAME,
    privateKey: hasValidPrivateKey ? rawPrivateKey : undefined,
    hasValidPrivateKey,
  };
};
