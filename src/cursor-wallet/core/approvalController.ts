import type {
  CursorWalletApprovalController,
  CursorWalletApprovalDecision,
  CursorWalletApprovalRequest,
} from "../types";

type PendingRequest = CursorWalletApprovalRequest & {
  resolve: (decision: CursorWalletApprovalDecision) => void;
};

const makeRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const createCursorWalletApprovalController = (): CursorWalletApprovalController => {
  const queue: PendingRequest[] = [];
  const listeners = new Set<(request: CursorWalletApprovalRequest | null) => void>();
  let active: PendingRequest | null = null;

  const notify = () => {
    listeners.forEach((listener) => listener(active));
  };

  const shiftNext = () => {
    active = queue.shift() ?? null;
    notify();
  };

  const settleActive = (decision: CursorWalletApprovalDecision) => {
    if (!active) return;

    const current = active;
    active = null;
    current.resolve(decision);
    shiftNext();
  };

  return {
    enqueue(request) {
      return new Promise<CursorWalletApprovalDecision>((resolve) => {
        const pending: PendingRequest = {
          ...request,
          id: makeRequestId(),
          createdAt: Date.now(),
          resolve,
        };

        if (!active) {
          active = pending;
          notify();
          return;
        }

        queue.push(pending);
      });
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(active);

      return () => {
        listeners.delete(listener);
      };
    },

    approve(requestId) {
      if (!active || active.id !== requestId) return;
      settleActive({ approved: true });
    },

    reject(requestId, reason) {
      if (!active || active.id !== requestId) return;
      settleActive({ approved: false, reason });
    },

    rejectAll(reason = "Cursor wallet approval controller reset") {
      if (active) {
        active.resolve({ approved: false, reason });
        active = null;
      }

      while (queue.length > 0) {
        const next = queue.shift();
        next?.resolve({ approved: false, reason });
      }

      notify();
    },
  };
};

export const defaultCursorWalletApprovalController =
  createCursorWalletApprovalController();
