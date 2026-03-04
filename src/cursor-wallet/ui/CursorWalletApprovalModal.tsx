"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { formatEther } from "viem";

import type {
  CursorWalletApprovalController,
  CursorWalletApprovalRequest,
  CursorWalletTransactionRequest,
  CursorWalletUiOptions,
} from "../types";

interface CursorWalletApprovalModalProps {
  request: CursorWalletApprovalRequest;
  controller: CursorWalletApprovalController;
  uiOptions?: CursorWalletUiOptions;
}

const DEFAULT_REDACT_THRESHOLD = 280;

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const trimPreview = (value: string, threshold: number) => {
  if (value.length <= threshold) return value;
  return `${value.slice(0, threshold)}...`;
};

const parseHexBigInt = (hexValue?: string) => {
  if (!hexValue) return undefined;

  try {
    return BigInt(hexValue);
  } catch {
    return undefined;
  }
};

const renderMethodDetails = (
  request: CursorWalletApprovalRequest,
  redactDataThreshold: number
): React.ReactNode => {
  const params = request.params;

  if (request.method === "eth_sendTransaction") {
    const tx = (params[0] ?? {}) as CursorWalletTransactionRequest;
    const valueWei = parseHexBigInt(tx.value);

    return (
      <div style={{ display: "grid", gap: "8px", fontSize: "14px", color: "#e5e5e5" }}>
        <div>
          <span style={{ color: "#a1a1aa" }}>From:</span> {tx.from ?? "(wallet default)"}
        </div>
        <div>
          <span style={{ color: "#a1a1aa" }}>To:</span> {tx.to ?? "(contract creation)"}
        </div>
        <div>
          <span style={{ color: "#a1a1aa" }}>Value:</span>{" "}
          {valueWei === undefined ? "0" : `${formatEther(valueWei)} ETH`}
        </div>
        <div>
          <span style={{ color: "#a1a1aa" }}>Data:</span>
          <pre
            style={{
              marginTop: "6px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              borderRadius: "8px",
              background: "#171717",
              padding: "10px",
              color: "#d4d4d8",
              fontSize: "12px",
            }}
          >
            {trimPreview(tx.data ?? "0x", redactDataThreshold)}
          </pre>
        </div>
      </div>
    );
  }

  if (request.method === "eth_signTypedData_v4") {
    const typedDataRaw = params[1] ?? params[0];
    const typedData =
      typeof typedDataRaw === "string"
        ? trimPreview(typedDataRaw, redactDataThreshold)
        : trimPreview(safeStringify(typedDataRaw), redactDataThreshold);

    return (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          borderRadius: "8px",
          background: "#171717",
          padding: "10px",
          color: "#d4d4d8",
          fontSize: "12px",
        }}
      >
        {typedData}
      </pre>
    );
  }

  if (request.method === "wallet_switchEthereumChain") {
    const payload = params[0] as { chainId?: string } | undefined;

    return (
      <div style={{ fontSize: "14px", color: "#e5e5e5" }}>
        <span style={{ color: "#a1a1aa" }}>Target chain:</span> {payload?.chainId ?? "unknown"}
      </div>
    );
  }

  const messageCandidate = params.find((candidate) => typeof candidate === "string");

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        borderRadius: "8px",
        background: "#171717",
        padding: "10px",
        color: "#d4d4d8",
        fontSize: "12px",
      }}
    >
      {trimPreview(
        typeof messageCandidate === "string" ? messageCandidate : safeStringify(params),
        redactDataThreshold
      )}
    </pre>
  );
};

export const CursorWalletApprovalModal: React.FC<CursorWalletApprovalModalProps> = ({
  request,
  controller,
  uiOptions,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const redactDataThreshold = uiOptions?.redactDataThreshold ?? DEFAULT_REDACT_THRESHOLD;
  const zIndex = uiOptions?.zIndex ?? 1000;

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(3px)",
  };

  const panelStyle: React.CSSProperties = {
    width: "min(560px, calc(100vw - 32px))",
    maxHeight: "min(640px, calc(100vh - 32px))",
    overflowY: "auto",
    borderRadius: "12px",
    border: "1px solid #3f3f46",
    background: "#09090b",
    padding: "20px",
    boxShadow:
      "0 20px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.02) inset",
  };

  const rejectButtonStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: "8px",
    border: "1px solid #52525b",
    background: "#18181b",
    padding: "10px 16px",
    color: "#e4e4e7",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const approveButtonStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: "8px",
    border: "1px solid #e4e4e7",
    background: "#e4e4e7",
    padding: "10px 16px",
    color: "#111111",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  };

  return createPortal(
    <div className={uiOptions?.theme?.overlayClassName ?? ""} style={overlayStyle}>
      <div className={uiOptions?.theme?.panelClassName ?? ""} style={panelStyle}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#a1a1aa" }}>
            CURSOR WALLET REQUEST
          </div>
          <h2 style={{ marginTop: "2px", fontSize: "32px", fontWeight: 700, color: "#ffffff" }}>
            {request.method}
          </h2>
          <div style={{ marginTop: "6px", fontSize: "13px", color: "#a1a1aa" }}>
            Account {request.account}
          </div>
          <div style={{ fontSize: "13px", color: "#a1a1aa" }}>Chain ID {request.chainId}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>{renderMethodDetails(request, redactDataThreshold)}</div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => controller.reject(request.id, "Rejected by user")}
            className={uiOptions?.theme?.buttonRejectClassName ?? ""}
            style={rejectButtonStyle}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => controller.approve(request.id)}
            className={uiOptions?.theme?.buttonApproveClassName ?? ""}
            style={approveButtonStyle}
          >
            Approve
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
