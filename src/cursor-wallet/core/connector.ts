import {
  ChainNotConfiguredError,
  createConnector,
  type CreateConnectorFn,
} from "wagmi";
import { ConnectorNotConnectedError } from "@wagmi/core";
import {
  type AddEthereumChainParameter,
  type Address,
  type Chain,
  getAddress,
  hexToNumber,
  isAddress,
  isHex,
  numberToHex,
  SwitchChainError,
  UserRejectedRequestError,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";

import type {
  CreateCursorWalletOptions,
  CursorWalletApprovalController,
  CursorWalletRequestKind,
  CursorWalletRpcRequest,
  CursorWalletTransactionRequest,
} from "../types";

type CursorWalletProvider = {
  request: (request: CursorWalletRpcRequest) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

const toBigIntOrUndefined = (value?: string) => (value ? BigInt(value) : undefined);

const resolveMessageForSigning = (value: unknown) => {
  if (typeof value !== "string") throw new Error("Invalid message payload");
  return isHex(value) ? ({ raw: value } as const) : value;
};

const waitForApproval = async (
  approvalController: CursorWalletApprovalController,
  method: CursorWalletRequestKind,
  params: unknown[],
  account: Address,
  chainId: number
) => {
  const decision = await approvalController.enqueue({
    method,
    params,
    account,
    chainId,
  });

  if (!decision.approved) {
    throw new UserRejectedRequestError(
      new Error(decision.reason ?? "Request rejected from Cursor wallet approval modal.")
    );
  }
};

export const createCursorWalletConnector = (
  options: CreateCursorWalletOptions
): CreateConnectorFn<CursorWalletProvider> => {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const walletName = options.walletName ?? "Cursor Wallet";
  const approvalController = options.approvalController;

  let connected = false;
  let activeChainId = 0;
  let userDisconnected = false;

  const getAccount = () => {
    if (!options.privateKey) {
      throw new Error(
        "Cursor Wallet private key is missing or invalid. Set NEXT_PUBLIC_DEV_WALLET_PRIVATE_KEY to a 0x-prefixed 64 hex value."
      );
    }

    return privateKeyToAccount(options.privateKey);
  };

  const emit = (event: string, ...args: unknown[]) => {
    const handlers = listeners.get(event);
    if (!handlers) return;
    handlers.forEach((listener) => listener(...args));
  };

  return createConnector((config) => {
    const chains = options.supportedChains ?? config.chains;
    activeChainId = chains[0]?.id ?? config.chains[0].id;

    const getChain = (chainId = activeChainId): Chain => {
      const chain = chains.find((candidate) => candidate.id === chainId);
      if (!chain) throw new ChainNotConfiguredError();
      return chain;
    };

    const getWalletClient = (chainId = activeChainId) => {
      const chain = getChain(chainId);
      const account = getAccount();
      const transport =
        config.transports?.[chain.id] ??
        http(chain.rpcUrls.default.http[0] ?? chain.rpcUrls.public?.http[0]);

      return createWalletClient({
        account,
        chain,
        transport,
      });
    };

    const provider: CursorWalletProvider = {
      request: async (request: CursorWalletRpcRequest): Promise<unknown> => {
        const params = Array.isArray(request.params) ? request.params : [];

        switch (request.method) {
          case "eth_requestAccounts": {
            const account = getAccount();
            connected = true;
            userDisconnected = false;
            emit("accountsChanged", [account.address]);
            return [account.address];
          }
          case "eth_accounts":
            return connected ? [getAccount().address] : [];
          case "eth_chainId":
            return numberToHex(activeChainId);
          case "wallet_switchEthereumChain": {
            const account = getAccount();
            await waitForApproval(
              approvalController,
              "wallet_switchEthereumChain",
              params,
              account.address,
              activeChainId
            );

            const payload = params[0] as AddEthereumChainParameter | undefined;
            const nextChainIdHex = payload?.chainId;
            if (!nextChainIdHex || !isHex(nextChainIdHex)) {
              throw new SwitchChainError(new Error("Missing chainId for switch request."));
            }

            const nextChainId = hexToNumber(nextChainIdHex);
            const chain = getChain(nextChainId);
            activeChainId = chain.id;
            emit("chainChanged", numberToHex(activeChainId));
            return null;
          }
          case "personal_sign": {
            const account = getAccount();
            await waitForApproval(
              approvalController,
              "personal_sign",
              params,
              account.address,
              activeChainId
            );

            const [first, second] = params;
            const [messageParam] =
              typeof first === "string" && isAddress(first) ? [second] : [first];
            return account.signMessage({
              message: resolveMessageForSigning(messageParam),
            });
          }
          case "eth_sign": {
            const account = getAccount();
            await waitForApproval(
              approvalController,
              "eth_sign",
              params,
              account.address,
              activeChainId
            );

            const [, payload] = params;
            return account.signMessage({
              message: resolveMessageForSigning(payload),
            });
          }
          case "eth_signTypedData_v4": {
            const account = getAccount();
            await waitForApproval(
              approvalController,
              "eth_signTypedData_v4",
              params,
              account.address,
              activeChainId
            );

            const [, typedDataRaw] = params;
            const typedData =
              typeof typedDataRaw === "string" ? JSON.parse(typedDataRaw) : typedDataRaw;
            return account.signTypedData(typedData as never);
          }
          case "eth_sendTransaction": {
            if (!connected) throw new ConnectorNotConnectedError();
            const account = getAccount();

            await waitForApproval(
              approvalController,
              "eth_sendTransaction",
              params,
              account.address,
              activeChainId
            );

            const tx = (params[0] ?? {}) as CursorWalletTransactionRequest;
            if (tx.from && getAddress(tx.from) !== account.address) {
              throw new UserRejectedRequestError(
                new Error("Transaction from address does not match Cursor wallet account.")
              );
            }

            const chainId = tx.chainId ? hexToNumber(tx.chainId) : activeChainId;
            const chain = getChain(chainId);
            const walletClient = getWalletClient(chain.id);

            const hash = await walletClient.sendTransaction({
              account,
              chain,
              to: tx.to ? getAddress(tx.to) : undefined,
              data: tx.data,
              value: toBigIntOrUndefined(tx.value),
              gas: toBigIntOrUndefined(tx.gas),
              gasPrice: toBigIntOrUndefined(tx.gasPrice),
              maxFeePerGas: toBigIntOrUndefined(tx.maxFeePerGas),
              maxPriorityFeePerGas: toBigIntOrUndefined(tx.maxPriorityFeePerGas),
              nonce: tx.nonce ? hexToNumber(tx.nonce) : undefined,
            } as never);

            if (activeChainId !== chain.id) {
              activeChainId = chain.id;
              emit("chainChanged", numberToHex(activeChainId));
            }

            return hash;
          }
          default:
            throw new Error(`Method not supported by ${walletName}: ${request.method}`);
        }
      },
      on(event: string, listener: (...args: unknown[]) => void) {
        const set = listeners.get(event) ?? new Set();
        set.add(listener);
        listeners.set(event, set);
      },
      removeListener(event: string, listener: (...args: unknown[]) => void) {
        listeners.get(event)?.delete(listener);
      },
    };

    return {
      id: "cursorWallet",
      name: walletName,
      rdns: "dev.cursor.wallet",
      type: "cursorWallet",
      async connect<withCapabilities extends boolean = false>({
        chainId,
        withCapabilities,
      }: { chainId?: number; withCapabilities?: withCapabilities | boolean } = {}) {
        const account = getAccount();
        if (chainId) {
          const chain = getChain(chainId);
          activeChainId = chain.id;
        }

        connected = true;
        userDisconnected = false;

        return {
          accounts: (withCapabilities
            ? [{ address: account.address, capabilities: {} }]
            : [account.address]) as unknown as withCapabilities extends true
            ? readonly { address: Address; capabilities: Record<string, unknown> }[]
            : readonly Address[],
          chainId: activeChainId,
        };
      },
      async disconnect() {
        connected = false;
        userDisconnected = true;
        approvalController.rejectAll("Disconnected from Cursor wallet.");
      },
      async getAccounts() {
        if (!connected) throw new ConnectorNotConnectedError();
        return [getAccount().address];
      },
      async getChainId() {
        return activeChainId;
      },
      async getProvider() {
        return provider;
      },
      async isAuthorized() {
        return !!options.privateKey && !userDisconnected;
      },
      async switchChain({ chainId }) {
        const account = getAccount();
        await waitForApproval(
          approvalController,
          "wallet_switchEthereumChain",
          [{ chainId: numberToHex(chainId) }],
          account.address,
          activeChainId
        );

        const chain = getChain(chainId);
        activeChainId = chain.id;
        return chain;
      },
      onAccountsChanged(accounts) {
        if (accounts.length === 0) this.onDisconnect();
        else config.emitter.emit("change", { accounts: accounts.map((x) => getAddress(x)) });
      },
      onChainChanged(chainId) {
        config.emitter.emit("change", { chainId: Number(chainId) });
      },
      async onDisconnect() {
        connected = false;
        approvalController.rejectAll("Provider disconnected from Cursor wallet.");
        config.emitter.emit("disconnect");
      },
    };
  });
};
