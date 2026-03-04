import type { Address, Chain, Hex } from "viem";

export interface CursorWalletConfig {
  enabled: boolean;
  walletName: string;
  privateKey?: Hex;
  hasValidPrivateKey: boolean;
}

export type CursorWalletRequestKind =
  | "personal_sign"
  | "eth_sign"
  | "eth_signTypedData_v4"
  | "eth_sendTransaction"
  | "wallet_switchEthereumChain";

export type CursorWalletRpcMethod =
  | "eth_requestAccounts"
  | "eth_accounts"
  | "eth_chainId"
  | CursorWalletRequestKind;

export interface CursorWalletRpcRequest {
  method: CursorWalletRpcMethod | (string & {});
  params?: unknown;
}

export interface CursorWalletTransactionRequest {
  from?: Address;
  to?: Address;
  data?: Hex;
  value?: Hex;
  gas?: Hex;
  gasPrice?: Hex;
  maxFeePerGas?: Hex;
  maxPriorityFeePerGas?: Hex;
  nonce?: Hex;
  chainId?: Hex;
}

export interface CursorWalletApprovalRequest {
  id: string;
  method: CursorWalletRequestKind;
  params: unknown[];
  account: Address;
  chainId: number;
  createdAt: number;
}

export type CursorWalletApprovalDecision =
  | { approved: true }
  | { approved: false; reason?: string };

export interface CursorWalletApprovalController {
  enqueue(
    request: Omit<CursorWalletApprovalRequest, "id" | "createdAt">
  ): Promise<CursorWalletApprovalDecision>;
  subscribe(listener: (request: CursorWalletApprovalRequest | null) => void): () => void;
  approve(requestId: string): void;
  reject(requestId: string, reason?: string): void;
  rejectAll(reason?: string): void;
}

export interface CursorWalletThemeTokens {
  overlayClassName?: string;
  panelClassName?: string;
  buttonApproveClassName?: string;
  buttonRejectClassName?: string;
}

export interface CursorWalletUiOptions {
  zIndex?: number;
  redactDataThreshold?: number;
  theme?: CursorWalletThemeTokens;
}

export interface CreateCursorWalletOptions {
  privateKey?: Hex;
  walletName?: string;
  enabled?: boolean;
  supportedChains?: readonly Chain[];
  approvalController: CursorWalletApprovalController;
}
