"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import * as React from "react";
import { WagmiProvider } from "wagmi";

import { CursorWalletApprovalProvider } from "@/cursor-wallet";
import { createWagmiAppConfig } from "@/lib/wagmi";

interface Web3ProviderProps {
  children: React.ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [{ config, chains }] = React.useState(() => createWagmiAppConfig());
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={chains[0]}>
          <CursorWalletApprovalProvider>{children}</CursorWalletApprovalProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
