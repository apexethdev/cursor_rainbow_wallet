"use client";

import * as React from "react";

import { defaultCursorWalletApprovalController } from "../core/approvalController";
import type {
  CursorWalletApprovalController,
  CursorWalletApprovalRequest,
  CursorWalletUiOptions,
} from "../types";
import { CursorWalletApprovalModal } from "./CursorWalletApprovalModal";

interface CursorWalletApprovalContextValue {
  controller: CursorWalletApprovalController;
}

const CursorWalletApprovalContext =
  React.createContext<CursorWalletApprovalContextValue | null>(null);

interface CursorWalletApprovalProviderProps {
  controller?: CursorWalletApprovalController;
  uiOptions?: CursorWalletUiOptions;
  children: React.ReactNode;
}

export const CursorWalletApprovalProvider: React.FC<CursorWalletApprovalProviderProps> = ({
  controller = defaultCursorWalletApprovalController,
  uiOptions,
  children,
}) => {
  const [activeRequest, setActiveRequest] =
    React.useState<CursorWalletApprovalRequest | null>(null);

  React.useEffect(() => {
    const unsubscribe = controller.subscribe(setActiveRequest);

    return () => {
      unsubscribe();
      controller.rejectAll("Cursor wallet approval provider unmounted.");
    };
  }, [controller]);

  return (
    <CursorWalletApprovalContext.Provider value={{ controller }}>
      {children}
      {activeRequest && (
        <CursorWalletApprovalModal
          request={activeRequest}
          controller={controller}
          uiOptions={uiOptions}
        />
      )}
    </CursorWalletApprovalContext.Provider>
  );
};

export const useCursorWalletApprovalController = () => {
  const context = React.useContext(CursorWalletApprovalContext);

  if (!context) {
    throw new Error(
      "useCursorWalletApprovalController must be used within CursorWalletApprovalProvider."
    );
  }

  return context.controller;
};
