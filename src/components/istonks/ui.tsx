"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Copy, Loader2 } from "lucide-react";

import { useSession } from "@/components/shell/session-provider";
import { BASESCAN_URL, readError, shortAddress, type StockStatus } from "@/lib/istonks";
import { cn } from "@/lib/utils";

/* ── data ───────────────────────────────────────────────────────────── */

export interface Fetched<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Upstream endpoint isn't deployed yet — render an empty state, not an error. */
  unavailable: boolean;
  /** Session went away between SSR and this fetch — show the sign-in gate. */
  unauthorized: boolean;
  reload: () => void;
}

/**
 * Small no-store fetch hook for the iStonks proxy routes. An empty `path`
 * skips the request, so callers can short-circuit on a bad route param
 * without breaking hook order.
 */
export function useIstonks<T>(path: string): Fetched<T> {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<Omit<Fetched<T>, "reload">>(() => ({
    data: null,
    loading: Boolean(path),
    error: null,
    unavailable: false,
    unauthorized: false,
  }));

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(path, { cache: "no-store" });
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        // A 404 means the agent endpoint isn't deployed yet — that's an empty
        // state, not a failure. The public proxies already fold this in; the
        // authenticated /api/app/* proxy passes the upstream status through.
        if (res.status === 404) {
          setState({
            data: null,
            loading: false,
            error: null,
            unavailable: true,
            unauthorized: false,
          });
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setState({
            data: null,
            loading: false,
            error: null,
            unavailable: false,
            unauthorized: true,
          });
          return;
        }
        if (!res.ok) {
          setState({
            data: null,
            loading: false,
            error: readError(body) ?? `HTTP ${res.status}`,
            unavailable: false,
            unauthorized: false,
          });
          return;
        }
        setState({
          data: body as T,
          loading: false,
          error: null,
          unavailable: Boolean(body && (body as { unavailable?: boolean }).unavailable),
          unauthorized: false,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          unavailable: false,
          unauthorized: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}

/* ── table ──────────────────────────────────────────────────────────── */

export function Table({
  head,
  children,
}: {
  head: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th
                key={i}
                className="border-b border-border pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-border/50 transition-colors last:border-0 hover:bg-accent/40">
      {children}
    </tr>
  );
}

export function Cell({
  children,
  className,
  mono,
}: {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "py-2.5 pr-4 align-middle text-[13px] text-foreground",
        mono && "font-mono text-[12px] tabular-nums",
        className,
      )}
    >
      {children}
    </td>
  );
}

/* ── bits ───────────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<StockStatus, string> = {
  launchable: "border-up/40 bg-up/10 text-up",
  listed: "border-primary/30 bg-primary/10 text-primary",
  registered: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.14em]",
        STATUS_STYLE[status],
      )}
    >
      {status}
    </span>
  );
}

/** Monospace address with a Basescan link. */
export function AddressLink({
  address,
  full,
  kind = "address",
}: {
  address: string | null;
  full?: boolean;
  kind?: "address" | "token" | "tx";
}) {
  if (!address) return <span className="font-mono text-[12px] text-muted-foreground">—</span>;
  const path = kind === "tx" ? "tx" : kind === "token" ? "token" : "address";
  return (
    <a
      href={`${BASESCAN_URL}/${path}/${address}`}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-[12px] text-muted-foreground transition-colors hover:text-primary"
    >
      {full ? address : shortAddress(address)}
    </a>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is unavailable (insecure context) — the value stays visible.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]",
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function LoadingRows({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border/50 last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="py-3 pr-4">
              <div className="h-3 w-full max-w-[140px] animate-pulse rounded-full bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  mascot = "mate-peace.png",
  action,
}: {
  title: string;
  body: string;
  mascot?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[20px] border border-border bg-card px-6 py-12 text-center shadow-[var(--shadow-card)]">
      <div className="rounded-2xl bg-white p-2">
        <Image
          src={`/brand/mascot/${mascot}`}
          alt=""
          width={72}
          height={72}
          className="size-16 object-contain"
        />
      </div>
      <div>
        <p className="font-display text-base font-semibold">{title}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      {action}
    </div>
  );
}

export function ErrorBand({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-down/40 bg-down/10 px-4 py-2.5 font-mono text-[11px] leading-relaxed text-down">
      <AlertTriangle className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
}

/** Sign-in prompt for gated /istonks pages — opens the shared session dialog. */
export function SignInGate({ what }: { what: string }) {
  const { openSignIn } = useSession();
  return (
    <EmptyState
      mascot="mate-support.png"
      title="Sign in to continue"
      body={`${what} is tied to your Basemate wallet. Sign in with the same email you use in iMessage.`}
      action={
        <button
          type="button"
          onClick={openSignIn}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          Sign in
        </button>
      }
    />
  );
}
