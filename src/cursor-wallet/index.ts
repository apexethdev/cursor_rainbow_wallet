export { getCursorWalletConfig } from "./env/config";
export {
  createCursorWalletApprovalController,
  defaultCursorWalletApprovalController,
} from "./core/approvalController";
export { createCursorWalletConnector } from "./core/connector";
export { createCursorWalletRainbowWallet } from "./adapters/rainbowWallet";
export {
  CursorWalletApprovalProvider,
  useCursorWalletApprovalController,
} from "./ui/CursorWalletApprovalProvider";

export type {
  CreateCursorWalletOptions,
  CursorWalletApprovalController,
  CursorWalletApprovalDecision,
  CursorWalletApprovalRequest,
  CursorWalletConfig,
  CursorWalletRequestKind,
  CursorWalletRpcMethod,
  CursorWalletRpcRequest,
  CursorWalletTransactionRequest,
  CursorWalletUiOptions,
} from "./types";
