"use client";

import { useCallback, useEffect, useState } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCurrentUser,
  useGetAccessToken,
  useIsSignedIn,
  useSignInWithEmail,
  useSignOut,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Plus,
  Send,
  Settings,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";

import { OnrampPaymentFrame } from "@/app/pay/onramp-payment-frame";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "213ae300-ae45-48ba-b2c0-823126466b83";

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "Basemate",
  appLogoUrl: "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png",
  ethereum: { createOnLogin: "smart" as const },
};

export function AppClient() {
  return (
    <CDPReactProvider config={cdpConfig}>
      <AuthGate />
    </CDPReactProvider>
  );
}

type AuthPhase = "checking" | "email" | "otp" | "linking" | "ready" | "error";

function AuthGate() {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { getAccessToken } = useGetAccessToken();
  const { signOut } = useSignOut();

  const [phase, setPhase] = useState<AuthPhase>("checking");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // If a dashboard session cookie already exists, skip sign-in.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/app/profile", { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setPhase("ready");
        else setPhase((p) => (p === "checking" ? (isSignedIn ? "linking" : "email") : p));
      })
      .catch(() => {
        if (!cancelled) setPhase((p) => (p === "checking" ? "email" : p));
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const linkSession = useCallback(async () => {
    if (!currentUser) return;
    setPhase("linking");
    try {
      // A CDP access token proves the signed-in end user server-side — no wallet
      // signing, and it works before the smart account is deployed on-chain.
      const raw = (await getAccessToken()) as unknown;
      const accessToken =
        typeof raw === "string" ? raw : (raw as { accessToken?: string })?.accessToken;
      if (!accessToken) throw new Error("Couldn't read your Basemate session.");

      const res = await fetch("/api/app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Sign-in failed.");
      setPhase("ready");
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }, [currentUser, getAccessToken]);

  // CDP already has a session (e.g. from a prior /wallet/connect) — skip the
  // email form and link straight away instead of erroring "already authenticated".
  useEffect(() => {
    if ((phase === "email" || phase === "otp") && isSignedIn) setPhase("linking");
  }, [phase, isSignedIn]);

  // Once signed in (via existing session or after OTP), link the dashboard session.
  useEffect(() => {
    if (phase === "linking" && isSignedIn && currentUser) {
      void linkSession();
    }
  }, [phase, isSignedIn, currentUser, linkSession]);

  async function submitEmail() {
    if (!email) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setPhase("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send the code.";
      // Already signed in to CDP — link the existing session instead of erroring.
      if (/already authenticated|already signed in/i.test(msg)) {
        setPhase("linking");
        return;
      }
      setMessage(msg);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    if (!flowId || !otp) return;
    setBusy(true);
    setMessage("");
    try {
      await verifyEmailOTP({ flowId, otp });
      setPhase("linking");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That code didn't work — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "ready") return <Dashboard />;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo/basemate-mark.png"
        alt="Basemate"
        className="h-14 w-14 rounded-2xl shadow-[var(--shadow-card)]"
      />
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Your Basemate account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your email — same as in Basemate.</p>
      </div>

      {phase === "checking" || phase === "linking" ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {phase === "linking" ? "Linking your account…" : "Loading…"}
          </p>
        </div>
      ) : phase === "error" ? (
        <div className="w-full">
          <p className="text-sm text-destructive">{message}</p>
          <button
            type="button"
            onClick={async () => {
              // Sign out of CDP so we don't immediately re-link the same session
              // (and so the user can switch email accounts).
              try {
                await signOut();
              } catch {
                // ignore
              }
              await fetch("/api/app/session", { method: "DELETE" }).catch(() => { });
              setMessage("");
              setEmail("");
              setOtp("");
              setFlowId(null);
              setPhase("email");
            }}
            className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      ) : phase === "otp" ? (
        <div className="w-full">
          <input
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="123456"
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg tracking-widest"
          />
          {message ? <p className="mt-2 text-sm text-destructive">{message}</p> : null}
          <button
            type="button"
            onClick={submitOtp}
            disabled={busy || otp.length < 6}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Verify
          </button>
        </div>
      ) : (
        <div className="w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-border bg-card px-4 py-3"
          />
          {message ? <p className="mt-2 text-sm text-destructive">{message}</p> : null}
          <button
            type="button"
            onClick={submitEmail}
            disabled={busy || !email}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send code
          </button>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

type Tab = "home" | "activity" | "earn" | "sends" | "bets" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "home", label: "Home", icon: Wallet },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "earn", label: "Earn", icon: Sparkles },
  { id: "sends", label: "Sends", icon: Send },
  { id: "bets", label: "Bets", icon: Trophy },
  { id: "settings", label: "You", icon: Settings },
];

const TAB_IDS = TABS.map((t) => t.id) as Tab[];

// Friendly hash aliases so deep links land on the right tab. Basemate sends
// these in chat (e.g. /app#balance, /app#payments); the canonical tab ids
// (/app#activity, /app#sends, …) also work directly.
const HASH_ALIASES: Record<string, Tab> = {
  balance: "home",
  yield: "earn",
  earning: "earn",
  payment: "settings",
  payments: "settings",
  you: "settings",
};

function tabFromHash(): Tab | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "").trim().toLowerCase();
  if (!raw) return null;
  if ((TAB_IDS as string[]).includes(raw)) return raw as Tab;
  return HASH_ALIASES[raw] ?? null;
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>("home");

  // Sync the active tab with the URL hash so deep links (e.g. /app#activity)
  // open the right page — both on first load and when the hash changes while
  // the dashboard is already open. Reading the hash post-mount (not in the
  // initial state) avoids a server/client hydration mismatch.
  useEffect(() => {
    const sync = () => {
      const next = tabFromHash();
      if (next) setTab(next);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const selectTab = useCallback((id: Tab) => {
    setTab(id);
    // Reflect the tab in the URL without pushing a new history entry.
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  const activeTitle =
    tab === "home"
      ? "Basemate"
      : tab === "bets"
        ? "World Cup"
        : tab === "settings"
          ? "Settings"
          : (TABS.find((t) => t.id === tab)?.label ?? "Basemate");

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2.5 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo/basemate-mark.png" alt="Basemate" className="h-7 w-7 rounded-full" />
        <span className="font-display text-base font-semibold tracking-tight">{activeTitle}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {tab === "home" && <HomeTab />}
        {tab === "activity" && <ActivityTab />}
        {tab === "earn" && <EarnTab />}
        {tab === "sends" && <SendsTab />}
        {tab === "bets" && <BetsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border/50 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="flex items-stretch justify-around px-1.5 py-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5"
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span
                  className={`text-[10px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function useApi<T>(path: string): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    setLoading(true);
    fetch(path, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
        setData(body as T);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [path]);
  useEffect(() => reload(), [reload]);
  return { data, loading, error, reload };
}

function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1 first:mt-0">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-[64px] w-full" />
      ))}
    </div>
  );
}

/** Shared list-row shell — white card on the lavender canvas for clear separation. */
function Row({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/50 bg-card px-4 py-3 ${className}`}
    >
      {children}
    </div>
  );
}

function usd(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface PortfolioPayload {
  totals: { totalUsd: number; coinsUsd: number; stakingUsd: number };
  coins: Array<{ id: string; symbol: string; name: string | null; amount: string; valueUsd: number; imageUrl: string | null }>;
  staking: Array<{ id: string; protocol: string; asset: string; valueUsd: number | null; apy: number | null }>;
  user: { wallets: string[] };
}

function HomeTab() {
  const { data, loading } = useApi<PortfolioPayload>("/api/app/portfolio");
  const total = data?.totals?.totalUsd ?? 0;
  const stakingUsd = data?.totals?.stakingUsd ?? 0;
  const coins = data?.coins ?? [];
  const staking = data?.staking ?? [];

  return (
    <>
      {/* Hero — the number that matters, then the primary money action */}
      <section className="rounded-[var(--radius-xl)] border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Total balance
        </p>
        {loading ? (
          <Skeleton className="mt-2 h-11 w-44 rounded-xl" />
        ) : (
          <p className="mt-1.5 font-display text-[2.6rem] font-bold leading-none tracking-tight tabular-nums">
            {usd(total)}
          </p>
        )}
        {stakingUsd > 0 && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-up">
            <Sparkles className="h-3.5 w-3.5" /> {usd(stakingUsd)} earning yield
          </p>
        )}

        <div className="mt-5 space-y-2">
          <AddFundsButton />
          {/* <div className="grid grid-cols-2 gap-2">
            <ReceiveButton />
            <a
              href="/pay/offramp"
              className="flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition active:scale-[0.99]"
            >
              <ArrowUpRight className="h-4 w-4" /> Cash out
            </a>
          </div> */}
        </div>
      </section>

      <SectionLabel>Tokens</SectionLabel>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : coins.length === 0 ? (
        <Empty text="No tokens yet — add funds to get started." mascot="mate-peace" />
      ) : (
        <div className="space-y-2">
          {coins.map((c) => (
            <Row key={c.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {c.symbol.slice(0, 3)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.symbol}</p>
                  <p className="truncate text-xs tabular-nums text-muted-foreground">
                    {Number(c.amount).toLocaleString()} {c.symbol}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{usd(c.valueUsd)}</p>
            </Row>
          ))}
        </div>
      )}

      {staking.length > 0 && (
        <>
          <SectionLabel>Earning</SectionLabel>
          <div className="space-y-2">
            {staking.map((s) => (
              <Row key={s.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold capitalize">
                    {s.protocol} · {s.asset}
                  </p>
                  {s.apy != null && (
                    <p className="text-xs font-semibold text-up">
                      {(s.apy * 100).toFixed(2)}% APY
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{usd(s.valueUsd)}</p>
              </Row>
            ))}
          </div>
        </>
      )}
    </>
  );
}

type FundPayOption = {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
};

function AddFundsButton() {
  const { currentUser } = useCurrentUser();
  const email = currentUser?.authenticationMethods?.email?.email ?? "";
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{
    paymentLinkOptions: FundPayOption[];
    expiresAt: string;
  } | null>(null);

  const numericAmount = Number(amount);
  const canContinue = Number.isFinite(numericAmount) && numericAmount > 0;

  function close() {
    if (busy) return;
    setOpen(false);
    setSession(null);
    setError(null);
    setAmount("");
  }

  async function continueToApplePay() {
    if (!canContinue || busy) return;
    setBusy(true);
    setError(null);
    try {
      const q = new URLSearchParams({ amount: String(numericAmount) });
      if (email) q.set("email", email);
      const res = await fetch(`/api/app/fund-session?${q.toString()}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      // Hosted fallback: single-use token, must navigate (can't embed in iframe).
      if (body?.redirectUrl) {
        window.location.href = body.redirectUrl as string;
        return;
      }
      if (!body?.paymentLinkOptions?.length) {
        throw new Error(body?.error ?? "Couldn't start Apple Pay.");
      }
      setSession({
        paymentLinkOptions: body.paymentLinkOptions as FundPayOption[],
        expiresAt: body.expiresAt as string,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Add funds.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" /> Add funds
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className={`max-h-[92vh] w-full overflow-y-auto rounded-[var(--radius-xl)] bg-card p-6 shadow-[var(--shadow-modal)] ${session ? "max-w-lg" : "max-w-md"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-lg font-bold">Add funds</p>
            {session ? (
              <div className="mt-4">
                <OnrampPaymentFrame
                  flow="onramp"
                  paymentLinkOptions={session.paymentLinkOptions}
                  expiresAt={session.expiresAt}
                />
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buy USDC on Base with Apple Pay. Enter how much you want to add.
                </p>
                <label className="mt-5 block">
                  <span className="sr-only">Amount in USD</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary px-4 py-3">
                    <span className="font-display text-2xl font-bold text-muted-foreground">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="1"
                      autoFocus
                      placeholder="25"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") continueToApplePay();
                      }}
                      className="w-full bg-transparent font-display text-2xl font-bold tabular-nums outline-none"
                    />
                  </div>
                </label>
                {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
                <button
                  type="button"
                  onClick={continueToApplePay}
                  disabled={!canContinue || busy}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {busy ? "Starting Apple Pay…" : "Continue to Apple Pay"}
                </button>
                <p className="mt-3 text-center text-[11px] leading-4 text-muted-foreground">
                  By continuing you agree to Coinbase&apos;s Guest Checkout terms.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReceiveButton() {
  const { data } = useApi<{ embeddedAddress: string | null }>("/api/app/profile");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const address = data?.embeddedAddress ?? "";

  async function copy() {
    try {
      await navigator.clipboard?.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition active:scale-[0.99]"
      >
        <ArrowDownToLine className="h-4 w-4 rotate-180" /> Receive
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-modal)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-lg font-bold">Receive on Base</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send USDC or ETH on Base to this address.
            </p>
            {address && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${address}`}
                alt="Wallet address QR code"
                className="mx-auto mt-5 h-44 w-44 rounded-2xl bg-white p-2"
              />
            )}
            <p className="mt-4 break-all rounded-2xl border border-border/60 bg-secondary px-3 py-3 font-mono text-xs">
              {address || "—"}
            </p>
            <button
              type="button"
              onClick={copy}
              disabled={!address}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy address"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Empty({ text, mascot = "mate-peace" }: { text: string; mascot?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border/60 px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/brand/mascot/${mascot}.png`}
        alt=""
        className="h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow-[var(--shadow-card)]"
      />
      <p className="max-w-[16rem] text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

interface ActivityItem {
  id: string;
  label: string | null;
  amount: string | null;
  asset: string | null;
  status: string;
  explorerUrl: string | null;
  createdAt: string;
}

function ActivityTab() {
  const { data, loading } = useApi<{ items: ActivityItem[] }>("/api/app/activity");
  if (loading) return <ListSkeleton />;
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <Empty
        text="No transactions yet — your sends, swaps, and top-ups will show up here."
        mascot="mate-peace"
      />
    );
  }
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <Row key={t.id}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{t.label ?? "Transaction"}</p>
            {t.amount && (
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {t.amount} {t.asset}
              </p>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{fmtDateTime(t.createdAt)}</span>
            <span className="flex items-center gap-2">
              <StatusPill status={t.status} />
              {t.explorerUrl && (
                <a
                  href={t.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary"
                >
                  Basescan <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          </div>
        </Row>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = status === "confirmed";
  const bad = status === "failed" || status === "expired";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ok ? "bg-up/15 text-up" : bad ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
        }`}
    >
      {status}
    </span>
  );
}

function OutcomePill({ outcome }: { outcome: "win" | "loss" | "pending" | "refund" }) {
  const label =
    outcome === "win" ? "Won" : outcome === "loss" ? "Lost" : outcome === "refund" ? "Refunded" : "Pending";
  const cls =
    outcome === "win"
      ? "bg-up/15 text-up"
      : outcome === "loss"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

interface SendItem {
  id: string;
  recipientName: string | null;
  recipientPhone: string | null;
  amount: string | null;
  asset: string | null;
  status: string;
  explorerUrl: string | null;
  createdAt: string;
}

function SendsTab() {
  const { data, loading } = useApi<{ items: SendItem[] }>("/api/app/sends");
  if (loading) return <ListSkeleton />;
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <Empty
        text="You haven't sent anyone money yet — pay a friend and it'll show up here."
        mascot="mate-support"
      />
    );
  }
  return (
    <div className="space-y-2">
      {items.map((s) => (
        <Row key={s.id} className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {s.recipientName ?? s.recipientPhone ?? "Recipient"}
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">{fmtDate(s.createdAt)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {s.amount} {s.asset}
            </p>
            <div className="mt-0.5 flex justify-end">
              <StatusPill status={s.status} />
            </div>
          </div>
        </Row>
      ))}
    </div>
  );
}

interface YieldRate {
  protocol: string;
  name: string;
  asset: string;
  apy: number | null;
  address: string;
}

function EarnTab() {
  const { data, loading } = useApi<{ items: YieldRate[] }>("/api/app/yield/rates");
  const items = data?.items ?? [];
  return (
    <>
      <div className="rounded-2xl border border-primary/15 bg-accent px-4 py-3 text-sm text-accent-foreground">
        Tell Basemate <span className="font-semibold">&ldquo;earn on USDC&rdquo;</span> in chat to
        deposit into any of these.
      </div>

      <SectionLabel>Best rates on Base</SectionLabel>
      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Empty text="No yield opportunities available right now — check back soon." mascot="mate-peace" />
      ) : (
        <div className="space-y-2">
          {items.map((v) => (
            <Row key={v.address} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{v.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {v.protocol} · {v.asset}
                </p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold tabular-nums text-up">
                {v.apy != null ? `${(v.apy * 100).toFixed(2)}%` : "—"}
              </p>
            </Row>
          ))}
        </div>
      )}
    </>
  );
}

interface BetItem {
  id: string;
  match: string;
  pick: string;
  stakeBasemate: string;
  payoutBasemate: string | null;
  status: string;
  outcome: "win" | "loss" | "pending" | "refund";
  payoutUrl: string | null;
  kickoffAt: string;
}

function BetsTab() {
  const { data, loading } = useApi<{ items: BetItem[] }>("/api/app/worldcup/bets");
  if (loading) return <ListSkeleton />;
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <Empty
        text="No bets yet — ask Basemate about World Cup matches to place one."
        mascot="mate-win"
      />
    );
  }
  return (
    <div className="space-y-2">
      {items.map((b) => (
        <Row key={b.id}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{b.match}</p>
            <OutcomePill outcome={b.outcome} />
          </div>
          <p className="mt-1.5 text-xs capitalize text-muted-foreground">
            Pick: <span className="font-semibold text-foreground">{b.pick}</span> ·{" "}
            {Number(b.stakeBasemate).toLocaleString()} BASEMATE
          </p>
          {b.outcome === "win" && b.payoutBasemate && (
            <p className="mt-1 text-xs font-semibold text-up">
              Won {Number(b.payoutBasemate).toLocaleString()} BASEMATE
            </p>
          )}
          {b.payoutUrl && (
            <a
              href={b.payoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary"
            >
              View payout <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </Row>
      ))}
    </div>
  );
}

interface Prefs {
  payMode: "manual" | "quick";
  autoSendLimitUsd: number;
}

function SettingsTab() {
  const { data, loading, reload } = useApi<Prefs>("/api/app/preferences");
  const { data: profile } = useApi<{ displayName: string | null; basename: string | null; embeddedAddress: string | null; delegation: { active: boolean; expiresAt: string | null } | null }>("/api/app/profile");
  const [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState<string>("");

  useEffect(() => {
    if (data) setLimit(String(data.autoSendLimitUsd));
  }, [data]);

  async function save(next: Partial<Prefs>) {
    setSaving(true);
    try {
      await fetch("/api/app/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      reload();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ListSkeleton rows={3} />;
  const mode = data?.payMode ?? "manual";

  return (
    <>
      <SectionLabel>Account</SectionLabel>
      <Row>
        <p className="text-sm font-semibold">
          {profile?.displayName ?? profile?.basename ?? "Basemate account"}
        </p>
        {profile?.embeddedAddress && (
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {profile.embeddedAddress}
          </p>
        )}
        {profile?.delegation && (
          <p className="mt-2 text-xs text-muted-foreground">
            Auto-send authorization:{" "}
            <span
              className={
                profile.delegation.active
                  ? "font-semibold text-up"
                  : "font-semibold text-destructive"
              }
            >
              {profile.delegation.active ? "active" : "expired"}
            </span>
            {profile.delegation.expiresAt
              ? ` · until ${new Date(profile.delegation.expiresAt).toLocaleDateString()}`
              : ""}
          </p>
        )}
      </Row>

      <SectionLabel>Payments</SectionLabel>
      <Row>
        <p className="text-sm font-semibold">Confirmation</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose whether every payment needs a tap, or sends automatically.
        </p>
        <div className="mt-3 flex rounded-full bg-secondary p-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => save({ payMode: "manual" })}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${mode === "manual" ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground"}`}
          >
            Confirm each
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save({ payMode: "quick" })}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${mode === "quick" ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground"}`}
          >
            Automatic
          </button>
        </div>

        {mode === "quick" && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="text-sm font-semibold">Auto-approve limit</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payments above this amount still ask you to confirm.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1 rounded-full border border-border bg-background px-3">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm tabular-nums outline-none"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => save({ autoSendLimitUsd: Number(limit) })}
                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Row>

      <button
        type="button"
        onClick={async () => {
          await fetch("/api/app/session", { method: "DELETE" });
          window.location.reload();
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border/60 px-6 py-3 text-sm font-medium text-muted-foreground transition active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </>
  );
}
