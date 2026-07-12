"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";

type OfframpStatus =
  | "draft"
  | "launched"
  | "transaction_ready"
  | "approval_creating"
  | "approval_pending"
  | "transfer_submitted"
  | "processing"
  | "success"
  | "failed"
  | "expired"
  | "manual_review";

interface OfframpSession {
  id: string;
  status: OfframpStatus;
  requestedAmount: string;
  sellAmount: string | null;
  fiatTotal: string | null;
  fiatCurrency: string | null;
  coinbaseFee: string | null;
  approvalUrl: string | null;
  txHash: string | null;
  launchExpiresAt: string;
  transferExpiresAt: string | null;
}

export function OfframpFlow({
  token,
  mode,
}: {
  token: string;
  mode: "launch" | "return";
}) {
  const [session, setSession] = useState<OfframpSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"launch" | "approval" | "refresh" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (nextAction: "status" | "launch" | "refresh" | "approval") => {
      const response = await fetch("/api/offramp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, action: nextAction }),
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        error?: string;
        coinbaseUrl?: string;
        approvalUrl?: string;
        session?: OfframpSession;
        status?: OfframpStatus;
      } & Partial<OfframpSession>;
      if (!response.ok) throw new Error(payload.error || "Cash-out request failed.");
      return payload;
    },
    [token],
  );

  const refresh = useCallback(async () => {
    setAction("refresh");
    setError(null);
    try {
      const payload = await call("refresh");
      const next = payload.session ?? (payload as OfframpSession);
      setSession(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh cash-out status.");
      return null;
    } finally {
      setAction(null);
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const payload = await call(mode === "return" ? "refresh" : "status");
        if (!cancelled) setSession(payload.session ?? (payload as OfframpSession));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load cash-out.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [call, mode]);

  useEffect(() => {
    if (!session) return;
    // Poll while a cash-out is mid-flight — on the return page for Base Account
    // signing, and on any page once an embedded transfer has been submitted.
    const inFlight = ["transfer_submitted", "processing"].includes(session.status);
    const returning = mode === "return" && ["launched", "approval_pending"].includes(session.status);
    if (!inFlight && !returning) return;
    const timer = window.setInterval(() => void refresh(), 4_000);
    return () => window.clearInterval(timer);
  }, [mode, refresh, session]);

  function launch() {
    setAction("launch");
    setError(null);
    const launchUrl = new URL("/api/offramp", window.location.origin);
    launchUrl.searchParams.set("action", "launch");
    launchUrl.searchParams.set("token", token);
    window.location.assign(launchUrl);
  }

  async function approve() {
    setAction("approval");
    setError(null);
    try {
      const payload = await call("approval");
      const approvalUrl = payload.approvalUrl ?? payload.session?.approvalUrl;
      const next = payload.session ?? (payload as OfframpSession);
      // Embedded wallet: the transfer executed server-side (no signing URL).
      // Show progress and let the poller track the Coinbase cash-out.
      if (!approvalUrl) {
        if (next?.status && next.status !== "transaction_ready") {
          setSession(next);
          setAction(null);
          void refresh();
          return;
        }
        throw new Error("Transfer approval is not ready.");
      }
      window.location.assign(approvalUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create transfer approval.");
      setAction(null);
    }
  }

  if (loading) {
    return <StateCard icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Loading cash out…" />;
  }
  if (error && !session) {
    return <StateCard icon={<AlertCircle className="h-6 w-6" />} title="Cash out unavailable" body={error} tone="error" />;
  }
  if (!session) return null;

  if (session.status === "success") {
    return (
      <StateCard
        icon={<CheckCircle2 className="h-6 w-6" />}
        title="Cash out complete"
        body={`${session.sellAmount ?? session.requestedAmount} USDC was sent to Coinbase${
          session.fiatTotal ? ` for ${session.fiatTotal} ${session.fiatCurrency ?? "USD"}` : ""
        }.`}
        txHash={session.txHash}
      />
    );
  }
  if (["failed", "expired", "manual_review"].includes(session.status)) {
    return (
      <StateCard
        icon={<AlertCircle className="h-6 w-6" />}
        title={session.status === "expired" ? "Cash out expired" : "Cash out needs attention"}
        body={
          session.status === "manual_review"
            ? "The transfer status is uncertain. Basemate will not retry it automatically."
            : "No additional transfer will be submitted. Start a new cash-out from your chat."
        }
        tone="error"
        txHash={session.txHash}
      />
    );
  }

  if (session.status === "draft" || (mode === "launch" && session.status === "launched")) {
    return (
      <ActionCard
        title={`Cash out ${session.requestedAmount} USDC`}
        body="Coinbase will show available bank, PayPal, or Coinbase cash-out methods. After confirming there, you'll approve one USDC transfer from your Base Account."
        button="Continue to Coinbase"
        pending={action === "launch"}
        onClick={launch}
        error={error}
      />
    );
  }

  if (session.status === "transaction_ready") {
    return (
      <div className="mx-auto grid w-full max-w-xl gap-4">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Approve the USDC transfer</h2>
              <p className="text-sm text-muted-foreground">Review the exact order before signing.</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm">
            <Summary label="You send" value={`${session.sellAmount ?? session.requestedAmount} USDC on Base`} />
            {session.fiatTotal ? (
              <Summary label="You receive" value={`${session.fiatTotal} ${session.fiatCurrency ?? "USD"}`} />
            ) : null}
            {session.coinbaseFee ? (
              <Summary label="Coinbase fee" value={`${session.coinbaseFee} ${session.fiatCurrency ?? "USD"}`} />
            ) : null}
          </dl>
          <button
            type="button"
            onClick={approve}
            disabled={action !== null}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {action === "approval" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Review and sign with Base Account
          </button>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    );
  }

  const pendingMessage =
    session.status === "approval_pending"
      ? "Waiting for your Base Account signature."
      : session.status === "transfer_submitted"
        ? "Your USDC transfer was submitted on Base."
        : session.status === "processing"
          ? "Coinbase received the transfer and is processing your cash out."
          : "Coinbase is preparing the transfer details.";
  return (
    <ActionCard
      title="Cash out in progress"
      body={pendingMessage}
      button="Check status"
      pending={action === "refresh"}
      onClick={() => void refresh()}
      error={error}
      secondary={session.approvalUrl && session.status === "approval_pending" ? {
        label: "Open Base Account approval",
        href: session.approvalUrl,
      } : undefined}
    />
  );
}

function ActionCard({
  title,
  body,
  button,
  pending,
  onClick,
  error,
  secondary,
}: {
  title: string;
  body: string;
  button: string;
  pending: boolean;
  onClick: () => void;
  error: string | null;
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
      <Loader2 className={`h-7 w-7 text-primary ${pending ? "animate-spin" : ""}`} />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {button}
      </button>
      {secondary ? (
        <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={secondary.href}>
          {secondary.label}
        </a>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function StateCard({
  icon,
  title,
  body,
  tone = "success",
  txHash,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  tone?: "success" | "error";
  txHash?: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm">
      <div className={tone === "error" ? "text-destructive" : "text-primary"}>{icon}</div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        {body ? <p className="text-sm leading-6 text-muted-foreground">{body}</p> : null}
      </div>
      {txHash ? (
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View Base transaction
        </a>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
