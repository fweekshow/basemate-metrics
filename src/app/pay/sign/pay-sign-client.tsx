"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProviderInterface } from "@base-org/account";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

type PayMode = "quick" | "manual";

type WalletCall = { to: string; data?: string; value?: string };

type WalletKind = "embedded" | "base_account";

type PendingPay = {
  label: string | null;
  recipientDisplay: string | null;
  amount: string | null;
  tokenSymbol: string | null;
  calls: WalletCall[];
  chainId: string;
  from: string;
  walletKind: WalletKind;
  status: string;
  txHash: string | null;
  payMode: PayMode | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; pending: PendingPay }
  | { status: "signing"; pending: PendingPay }
  | { status: "done" }
  | { status: "error"; message: string };

const BASE_CHAIN_HEX = "0x2105";
const LOGO_URL =
  "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png";

/**
 * Build a Base Account provider for the chosen mode.
 *
 * Quick Pay uses a sub-account (local key on basemate.app) + auto spend
 * permissions, so after the one-time authorization every future payment signs
 * silently with no Coinbase popup. Approve Each Time pops the signer per tx.
 */
async function getProvider(mode: PayMode): Promise<ProviderInterface> {
  const { createBaseAccountSDK } = await import("@base-org/account/browser");
  const paymasterUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/paymaster` : undefined;

  return createBaseAccountSDK({
    appName: "Basemate",
    appLogoUrl: LOGO_URL,
    appChainIds: [8453],
    preference: { telemetry: false },
    ...(paymasterUrl ? { paymasterUrls: { 8453: paymasterUrl } } : {}),
    subAccounts:
      mode === "quick"
        ? { creation: "on-connect", defaultAccount: "sub" }
        : { funding: "manual" },
  }).getProvider();
}

/** Poll wallet_getCallsStatus until a receipt with a tx hash appears (or timeout). */
async function waitForTxHash(provider: ProviderInterface, id: string): Promise<string> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const status = (await provider.request({
      method: "wallet_getCallsStatus",
      params: [id],
    })) as { receipts?: Array<{ transactionHash?: string }> } | null;
    const hash = status?.receipts?.find((r) => r.transactionHash)?.transactionHash;
    if (hash) return hash;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Timed out waiting for the transaction to confirm.");
}

export function PaySignClient({ token }: { token: string }) {
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  // Default to Quick Pay: one authorization, then silent signing on basemate.app.
  const [mode, setMode] = useState<PayMode>("quick");
  const sdkWarmed = useRef(false);

  // Warm the SDK module cache on mount so the import() during signing resolves
  // as a microtask and doesn't drop Safari's popup user-activation.
  useEffect(() => {
    if (sdkWarmed.current) return;
    sdkWarmed.current = true;
    void import("@base-org/account/browser").catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pay/sign?s=${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Could not load this payment.");
        return body as PendingPay;
      })
      .then((pending) => {
        if (cancelled) return;
        if (pending.status === "signed") {
          setLoad({ status: "done" });
          return;
        }
        if (pending.payMode) setMode(pending.payMode);
        setLoad({ status: "ready", pending });
      })
      .catch((err) => {
        if (!cancelled) setLoad({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = useCallback(async () => {
    if (load.status !== "ready") return;
    const pending = load.pending;
    setLoad({ status: "signing", pending });

    // Basemate embedded wallet: no signing popup. Tapping Confirm executes the
    // transaction server-side via the user's delegation, then we're done.
    if (pending.walletKind === "embedded") {
      try {
        const res = await fetch("/api/pay/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || "Could not complete this transaction.");
        setLoad({ status: "done" });
        router.replace("/pay/success");
      } catch (err) {
        setLoad({
          status: "error",
          message: err instanceof Error ? err.message : "Could not complete this transaction.",
        });
      }
      return;
    }

    // Persist the mode choice in the background — never awaited before the popup.
    void fetch("/api/pay/sign", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, mode }),
    }).catch(() => undefined);

    try {
      const provider = await getProvider(mode);

      // Connect (creates the sub-account on-connect in Quick Pay). Kept as the
      // first popup-triggering call so it inherits the tap's user-activation.
      const connect = (await provider.request({
        method: "wallet_connect",
        params: [{ version: "1", capabilities: {} }],
      })) as { accounts?: Array<{ address?: string }> };
      const from = connect.accounts?.[0]?.address ?? pending.from;

      const paymasterUrl = `${window.location.origin}/api/paymaster`;
      const baseParams = {
        version: "1.0",
        chainId: pending.chainId || BASE_CHAIN_HEX,
        from,
        calls: pending.calls.map((c) => ({ to: c.to, data: c.data ?? "0x", value: c.value ?? "0x0" })),
      };

      let sendResult: unknown;
      try {
        sendResult = await provider.request({
          method: "wallet_sendCalls",
          params: [{ ...baseParams, capabilities: { paymasterService: { url: paymasterUrl } } }],
        });
      } catch {
        sendResult = await provider.request({ method: "wallet_sendCalls", params: [baseParams] });
      }

      const id = typeof sendResult === "string" ? sendResult : (sendResult as { id?: string })?.id;
      if (!id) throw new Error("The wallet did not return a transaction id.");

      const txHash = await waitForTxHash(provider, id);

      const res = await fetch("/api/pay/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, txHash }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not record the payment.");
      }

      setLoad({ status: "done" });
      router.replace("/pay/success");
    } catch (err) {
      setLoad({
        status: "error",
        message: err instanceof Error ? err.message : "Could not complete this payment.",
      });
    }
  }, [load, mode, router, token]);

  const pending = load.status === "ready" || load.status === "signing" ? load.pending : null;
  const isEmbedded = pending?.walletKind === "embedded";

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Wallet className="h-7 w-7" />
      </div>

      {load.status === "loading" ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading your payment…</p>
        </div>
      ) : load.status === "error" ? (
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="max-w-sm text-sm font-medium">{load.message}</p>
        </div>
      ) : load.status === "done" ? (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-up" />
          <p className="font-semibold">Payment sent</p>
          <p className="text-sm text-muted-foreground">You can close this page and head back to Basemate.</p>
        </div>
      ) : (
        <div className="w-full">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {pending?.label ?? "Confirm your payment"}
          </h1>
          {pending?.amount && pending?.tokenSymbol ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {pending.amount} {pending.tokenSymbol}
              {pending.recipientDisplay ? ` to ${pending.recipientDisplay}` : ""}
            </p>
          ) : null}

          <button
            type="button"
            onClick={confirm}
            disabled={load.status === "signing"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {load.status === "signing" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {load.status === "signing" ? "Confirming…" : "Confirm"}
          </button>

          {!isEmbedded && load.status !== "signing" ? (
            <button
              type="button"
              onClick={() => setMode((m) => (m === "quick" ? "manual" : "quick"))}
              className="mt-3 text-xs text-muted-foreground underline underline-offset-2"
            >
              {mode === "quick"
                ? "Prefer to approve every payment manually?"
                : "Switch back to instant Quick Pay"}
            </button>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {isEmbedded
              ? "Review the details above, then tap Confirm. Basemate signs from your account and covers the gas — no wallet popups."
              : mode === "quick"
                ? "First payment asks Base Account for a one-time approval, then future payments are instant. Gas is covered by Basemate."
                : "You’ll approve this payment in a Base Account prompt. Gas is covered by Basemate."}
          </p>
        </div>
      )}
    </section>
  );
}
