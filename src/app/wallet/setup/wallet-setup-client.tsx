"use client";

import { useEffect, useState } from "react";
import type { ProviderInterface } from "@base-org/account";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

type SetupState =
  | { status: "idle" | "checking" | "connecting" }
  | { status: "ready" }
  | { status: "success"; address: string }
  | { status: "error"; message: string };

type WalletConnectResult = {
  accounts?: Array<{
    address?: string;
    capabilities?: {
      signInWithEthereum?: {
        message?: string;
        signature?: string;
      };
    };
  }>;
};

async function getBaseAccountProvider(): Promise<ProviderInterface> {
  const { createBaseAccountSDK } = await import("@base-org/account/browser");

  return createBaseAccountSDK({
    appName: "Basemate",
    appChainIds: [8453],
    preference: {
      telemetry: false,
    },
  }).getProvider();
}

export function WalletSetupClient({ sessionToken }: { sessionToken: string }) {
  const [state, setState] = useState<SetupState>(() =>
    sessionToken
      ? { status: "checking" }
      : { status: "error", message: "Missing setup session. Open the latest link from Basemate." },
  );

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;

    fetch(`/api/wallet/setup?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Could not load setup session.");
      })
      .then(() => {
        if (!cancelled) setState({ status: "ready" });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  async function connectBaseAccount() {
    if (!sessionToken) return;
    setState({ status: "connecting" });
    try {
      const provider = await getBaseAccountProvider();
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }],
      }).catch(() => undefined);

      const nonce = window.crypto.randomUUID().replace(/-/g, "");
      const result = await provider.request({
        method: "wallet_connect",
        params: [
          {
            version: "1",
            capabilities: {
              signInWithEthereum: {
                nonce,
                chainId: "0x2105",
              },
            },
          },
        ],
      }) as WalletConnectResult;

      const account = result.accounts?.[0];
      const address = account?.address;
      const siwe = account?.capabilities?.signInWithEthereum;
      if (!address || !siwe?.message || !siwe.signature) {
        throw new Error("Base Account did not return a signed setup proof.");
      }

      const response = await fetch("/api/wallet/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: sessionToken,
          address,
          message: siwe.message,
          signature: siwe.signature,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || "Could not connect your Base Account.");
      }

      setState({ status: "success", address: body.address ?? address });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Could not connect your Base Account.",
      });
    }
  }

  const isBusy = state.status === "checking" || state.status === "connecting";

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Wallet className="h-7 w-7" />
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Create your Basemate wallet</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Create or connect a Base Account with a passkey. No Base App install needed. Once it connects,
          Basemate will remember this wallet for your iMessage chat.
        </p>
      </div>

      <div className="w-full rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
        {state.status === "success" ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-up" />
            <div>
              <p className="font-semibold">Base Account connected</p>
              <p className="mt-2 break-all rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{state.address}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              If funds are waiting for you, Basemate will claim them automatically and text you
              when they arrive.
            </p>
          </div>
        ) : state.status === "error" ? (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="max-w-sm text-sm font-medium">{state.message}</p>
            {sessionToken ? (
              <button
                type="button"
                onClick={() => setState({ status: "ready" })}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {isBusy ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : <Wallet className="h-10 w-10 text-primary" />}
            <button
              type="button"
              onClick={connectBaseAccount}
              disabled={state.status !== "ready"}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.status === "checking"
                ? "Loading setup..."
                : state.status === "connecting"
                  ? "Connecting..."
                  : "Create / connect Base Account"}
            </button>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Your browser may show a passkey, Face ID, or Coinbase approval prompt. That is the wallet creation step.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
