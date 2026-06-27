"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { createBaseAccountSDK } from "@base-org/account";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { basescanTxUrl } from "@/lib/embed";
import { SITE } from "@/lib/site";
import type { SignRequest } from "@/lib/sign";

const BASE_CHAIN_ID = 8453;

type Phase =
  | { status: "idle" }
  | { status: "working"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; txHash?: string };

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** wallet_sendCalls may return a bare id or an `{ id }` object across SDK versions. */
function normalizeCallsId(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "id" in result) {
    return String((result as { id: unknown }).id);
  }
  return String(result);
}

type CallsStatus = {
  status?: number | string;
  receipts?: Array<{ transactionHash?: string }>;
};

/** Poll wallet_getCallsStatus until a receipt lands (or we give up waiting). */
async function waitForReceipt(
  provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
  callsId: string,
): Promise<string | undefined> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const res = (await provider.request({
      method: "wallet_getCallsStatus",
      params: [callsId],
    })) as CallsStatus;

    const hash = res.receipts?.[0]?.transactionHash;
    if (hash) return hash;

    const { status } = res;
    if (status === 200 || status === "CONFIRMED") return undefined;
    if (status === 400 || status === 500 || status === "FAILED" || status === "REVERTED") {
      throw new Error("The transaction failed on Base. Nothing was charged — try again.");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return undefined;
}

function humanizeError(err: unknown): string {
  const code = (err as { code?: number })?.code;
  if (code === 4001) return "Signature declined. Tap to try again when you're ready.";
  const message = err instanceof Error ? err.message : String(err);
  return message || "Something went wrong reaching your Base Account. Please try again.";
}

export function SignTransaction({ request }: { request: SignRequest }) {
  const [phase, setPhase] = useState<Phase>({ status: "idle" });

  // The SDK touches browser-only storage on init, so build it lazily on the
  // first click rather than during render (which also runs on the server).
  const sdkRef = useRef<ReturnType<typeof createBaseAccountSDK> | null>(null);
  const getSdk = useCallback(() => {
    sdkRef.current ??= createBaseAccountSDK({
      appName: SITE.name,
      appLogoUrl: SITE.pfp,
      appChainIds: [BASE_CHAIN_ID],
    });
    return sdkRef.current;
  }, []);

  const sign = useCallback(async () => {
    setPhase({ status: "working", message: "Connecting your Base Account…" });
    try {
      const provider = getSdk().getProvider();

      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const connected = accounts?.[0];
      if (!connected) throw new Error("No Base Account is connected.");

      // The calldata is addressed to a specific account — signing from any other
      // one would route the trade through the wrong wallet. This is exactly the
      // mismatch the old Base App deeplink hid; here we catch it up front.
      if (connected.toLowerCase() !== request.from.toLowerCase()) {
        setPhase({
          status: "error",
          message: `This transaction was built for ${shortAddress(
            request.from,
          )}, but you're signed in as ${shortAddress(
            connected,
          )}. Switch to that Base Account and try again.`,
        });
        return;
      }

      setPhase({ status: "working", message: "Confirm in the Base Account popup…" });
      const result = await provider.request({
        method: "wallet_sendCalls",
        params: [
          {
            version: request.version,
            chainId: request.chainId,
            from: request.from,
            atomicRequired: true,
            calls: request.calls,
          },
        ],
      });

      const callsId = normalizeCallsId(result);
      setPhase({ status: "success" });

      const txHash = await waitForReceipt(provider, callsId);
      setPhase({ status: "success", txHash });
    } catch (err) {
      setPhase({ status: "error", message: humanizeError(err) });
    }
  }, [getSdk, request]);

  const working = phase.status === "working";

  if (phase.status === "success") {
    return (
      <main className="relative z-10 flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-[var(--shadow-card)]">
          <Image src="/brand/mascot/mate-win-buff.png" alt="" width={48} height={48} priority />
        </div>
        <div className="max-w-md space-y-3">
          <h1 className="flex items-center justify-center gap-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <CheckCircle2 className="size-6 text-up" />
            Signed
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {phase.txHash
              ? "Your transaction is confirmed on Base. You can head back to Basemate."
              : "Your transaction is on its way. Basemate will confirm it in your chat."}
          </p>
        </div>
        {phase.txHash ? (
          <Button
            render={<a href={basescanTxUrl(phase.txHash)} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
            variant="outline"
            size="lg"
            className="min-h-[48px] w-full max-w-xs gap-2 rounded-full px-6"
          >
            View on BaseScan
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Confirming on Base…
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="relative z-10 flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-[var(--shadow-card)]">
        <Image src="/brand/logo/basemate-mark.png" alt="Basemate" width={48} height={48} priority />
      </div>

      <div className="max-w-md space-y-3">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Review &amp; sign
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Sign this transaction right here with your Base Account — no app switching.
          Confirm with your passkey when the popup appears.
        </p>
      </div>

      <Button
        onClick={sign}
        disabled={working}
        size="lg"
        className="min-h-[52px] w-full max-w-xs gap-2 rounded-full px-6 text-base font-semibold"
      >
        {working ? <Loader2 className="size-4 animate-spin" /> : null}
        {working ? "Working…" : "Sign with Base Account"}
        {working ? null : <ArrowRight className="size-4" />}
      </Button>

      {phase.status === "working" ? (
        <p className="max-w-xs text-xs text-muted-foreground">{phase.message}</p>
      ) : phase.status === "error" ? (
        <p className="flex max-w-xs items-start gap-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{phase.message}</span>
        </p>
      ) : (
        <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-up" />
          Signing as {shortAddress(request.from)}
        </p>
      )}
    </main>
  );
}
