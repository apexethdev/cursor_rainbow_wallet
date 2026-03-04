import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

import {
  createCursorWalletRainbowWallet,
  defaultCursorWalletApprovalController,
  getCursorWalletConfig,
} from "@/cursor-wallet";

const appName = "Cursor Wallet Demo";
const chains = [baseSepolia] as const;

export const createWagmiAppConfig = () => {
  const walletConfig = getCursorWalletConfig();
  const projectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "cursor-wallet-demo-project-id";

  const connectors = connectorsForWallets(
    [
      {
        groupName: "Development",
        wallets: [
          createCursorWalletRainbowWallet({
            privateKey: walletConfig.privateKey,
            walletName: walletConfig.walletName,
            enabled: walletConfig.enabled,
            supportedChains: chains,
            approvalController: defaultCursorWalletApprovalController,
          }),
        ],
      },
    ],
    {
      appName,
      projectId,
    }
  );

  const config = createConfig({
    chains,
    connectors,
    transports: {
      [baseSepolia.id]: http(),
    },
  });

  return { config, chains };
};
