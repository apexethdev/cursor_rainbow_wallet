"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import * as React from "react";
import { numberToHex, parseEther } from "viem";
import { useAccount, useSendTransaction, useSignMessage } from "wagmi";
import { baseSepolia } from "wagmi/chains";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ActionState = {
  action: "idle" | "sign" | "switch" | "send";
  status: "ready" | "success" | "error";
  detail: string;
};

const INITIAL_STATE: ActionState = {
  action: "idle",
  status: "ready",
  detail: "Connect Cursor Wallet and run a demo action.",
};

const stringifyError = (value: unknown) => {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return "Unknown error";
  }
};

export default function Home() {
  const { address, chain, connector, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();
  const [result, setResult] = React.useState<ActionState>(INITIAL_STATE);
  const [mounted, setMounted] = React.useState(false);
  const canInteract = mounted && isConnected;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const runSignDemo = async () => {
    try {
      const signature = await signMessageAsync({
        message: `Cursor Wallet sign test at ${new Date().toISOString()}`,
      });

      setResult({
        action: "sign",
        status: "success",
        detail: `Signature: ${signature}`,
      });
    } catch (error) {
      setResult({
        action: "sign",
        status: "error",
        detail: stringifyError(error),
      });
    }
  };

  const runSwitchDemo = async () => {
    try {
      if (!connector) {
        throw new Error("No active connector. Connect a wallet first.");
      }

      const provider = (await connector.getProvider()) as {
        request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
      };

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(baseSepolia.id) }],
      });

      setResult({
        action: "switch",
        status: "success",
        detail: `Switched to chain ${baseSepolia.id} (${baseSepolia.name}).`,
      });
    } catch (error) {
      setResult({
        action: "switch",
        status: "error",
        detail: stringifyError(error),
      });
    }
  };

  const runSendDemo = async () => {
    try {
      if (!address) throw new Error("No connected address available.");

      const hash = await sendTransactionAsync({
        to: address,
        value: parseEther("0.000001"),
        chainId: baseSepolia.id,
      });

      setResult({
        action: "send",
        status: "success",
        detail: `Transaction hash: ${hash}`,
      });
    } catch (error) {
      setResult({
        action: "send",
        status: "error",
        detail: stringifyError(error),
      });
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-10">
        <header className="flex flex-col items-center space-y-4 text-center">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Cursor Wallet with RainbowKit and Wagmi
          </h1>
          <p className="max-w-3xl text-muted-foreground sm:text-base">
            This project demonstrates wallet connect/sign/switch/send flows in
            Cursor preview mode without browser extension wallets.
          </p>
          <p className="max-w-3xl rounded-md border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
            <strong>Warning:</strong> The private key is stored in a{" "}
            <code>NEXT_PUBLIC_</code> environment variable, which means it is
            embedded in the client-side bundle and visible to anyone who
            inspects the page. Never commit <code>.env.local</code>, use a
            real wallet, or deploy this app beyond your local development
            environment.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Connection State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <ConnectButton />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connected: {mounted ? (isConnected ? "Yes" : "No") : "–"}
              </p>
              <p className="text-sm text-muted-foreground">
                Address: {mounted ? (address ?? "–") : "–"}
              </p>
              <p className="text-sm text-muted-foreground">
                Chain:{" "}
                {mounted && chain ? `${chain.name} (${chain.id})` : "–"}
              </p>
            </div>
          </CardContent>
        </Card>

        {canInteract ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demo Actions</CardTitle>
                <CardDescription>
                  Each action triggers a manual approval modal from Cursor Wallet
                  before signing, switching chain, or sending a transaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={runSignDemo}
                    disabled={!canInteract || isSigning}
                    variant="default"
                  >
                    {isSigning ? "Signing..." : "Sign Message"}
                  </Button>
                  <Button
                    onClick={runSwitchDemo}
                    disabled={!canInteract}
                    variant="secondary"
                  >
                    Request Chain Switch (Base Sepolia)
                  </Button>
                  <Button
                    onClick={runSendDemo}
                    disabled={!canInteract || isSending}
                    variant="outline"
                  >
                    {isSending ? "Sending..." : "Send Self Tx"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Base Sepolia is the only configured chain in this demo. Switch
                  requests still show the approval flow to validate the wallet method
                  path.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Output</CardTitle>
                <CardDescription>Latest result from the action above.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge
                  variant={result.status === "error" ? "destructive" : "secondary"}
                >
                  {result.action} · {result.status}
                </Badge>
                <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 text-xs text-foreground">
                  {result.detail}
                </pre>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}
