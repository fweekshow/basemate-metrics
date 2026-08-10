"use client";

import { useCallback, useEffect, useState, createContext, useContext } from "react";
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
  ChevronDown,
  ExternalLink,
  Loader2,
  LogOut,
  Plus,
  Send,
  Settings,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { SendSheet, type SendPrefill } from "@/app/app/send-sheet";
import { BubbleMarkTile, MarkTile } from "@/app/app/app-brand-tiles";
import { OnrampPaymentFrame } from "@/app/pay/onramp-payment-frame";
import { IMESSAGE_HREF } from "@/lib/site";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "213ae300-ae45-48ba-b2c0-823126466b83";

const UI_PREVIEW_CLIENT = process.env.NEXT_PUBLIC_APP_UI_PREVIEW === "1";

const AppPreviewContext = createContext(false);
function useAppPreviewMode(): boolean {
  return useContext(AppPreviewContext);
}

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "Basemate",
  appLogoUrl: "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png",
  ethereum: { createOnLogin: "smart" as const },
};

export function AppClient() {
  if (UI_PREVIEW_CLIENT) {
    return <PreviewAuthGate />;
  }
  return (
    <CDPReactProvider config={cdpConfig}>
      <AuthGate />
    </CDPReactProvider>
  );
}

/** Local UI iteration — mock data, no CDP (avoids Safari "Load failed" on localhost). */
function PreviewAuthGate() {
  const [phase, setPhase] = useState<"checking" | "gate" | "ready">("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/app/profile", { cache: "no-store" })
      .then((res) => {
        if (cancelled) return;
        setPhase(res.ok ? "ready" : "gate");
      })
      .catch(() => {
        if (!cancelled) setPhase("gate");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function enterPreview() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/app/preview-login", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Preview login failed.");
      setPhase("ready");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Preview login failed.");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "ready") {
    return (
      <AppPreviewContext.Provider value>
        <Dashboard />
      </AppPreviewContext.Provider>
    );
  }

  return (
    <div className="app-dashboard mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col items-center justify-center gap-6 bg-background px-5 py-10 text-center">
      <MarkTile size={56} />
      <div>
        <h1 className="font-app-display text-2xl font-bold tracking-tight">Preview the new app</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Local UI only — sample balance, sends, contacts, and Interest. No iMessage account or agent
          required.
        </p>
      </div>
      {phase === "checking" ? (
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      ) : (
        <>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void enterPreview()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Open UI preview
          </button>
          <p className="text-xs text-muted-foreground">
            Turn off with{" "}
            <span className="font-mono">NEXT_PUBLIC_APP_UI_PREVIEW=0</span> to use real sign-in.
          </p>
        </>
      )}
    </div>
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
      const raw = err instanceof Error ? err.message : "Sign-in failed.";
      // Agent returns this when CDP email has no imessage_wallets row yet.
      if (/no basemate account is linked|not linked|connect it from basemate/i.test(raw)) {
        setMessage(
          "No Basemate account is linked to this email yet. Text Basemate in iMessage to set up first, then come back here.",
        );
      } else {
        setMessage(raw);
      }
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
      // CDP SDK surfaces axios "Network Error" when it can't reach Coinbase
      // (offline, adblock, or local/dev domain not allowlisted).
      if (/network error|failed to fetch|load failed/i.test(msg)) {
        setMessage(
          "Couldn't reach sign-in (Coinbase). Check your connection, or try again on basemate.app.",
        );
      } else {
        setMessage(msg);
      }
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
    <div className="app-dashboard mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 bg-background px-5 py-10 text-center">
      <MarkTile size={56} />
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Manage your Basemate account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in with the email you used when you set up Basemate in iMessage.
        </p>
      </div>

      <div className="w-full space-y-2 rounded-2xl border border-primary/20 bg-accent px-5 py-4 text-left text-sm leading-relaxed text-accent-foreground">
        <p>
          <span className="font-semibold">Returning users only.</span> New here?{" "}
          <a href="/" className="font-semibold text-primary underline-offset-2 hover:underline">
            Text Basemate in iMessage
          </a>{" "}
          to create your account first.
        </p>
      </div>

      {phase === "checking" || phase === "linking" ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {phase === "linking" ? "Linking your account…" : "Loading…"}
          </p>
        </div>
      ) : phase === "error" ? (
        <div className="w-full space-y-3">
          <p className="text-sm text-destructive">{message}</p>
          <a
            href={IMESSAGE_HREF}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Open in Messages
          </a>
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
            className="w-full rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground"
          >
            Try a different email
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

      <a
        href="/"
        className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        New here? Text Basemate to get started
      </a>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

type Tab = "home" | "activity" | "interest" | "contacts" | "agent";

const TABS: { id: Tab; label: string; icon: typeof Wallet }[] = [
  { id: "home", label: "Home", icon: Wallet },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "interest", label: "Interest", icon: Sparkles },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "agent", label: "Agent", icon: Settings },
];

const TAB_IDS = TABS.map((t) => t.id) as Tab[];

// Friendly hash aliases so deep links land on the right tab. Basemate sends
// these in chat (e.g. /app#balance, /app#payments); the canonical tab ids
// (/app#activity, /app#sends, …) also work directly.
const HASH_ALIASES: Record<string, Tab> = {
  balance: "home",
  yield: "interest",
  earning: "interest",
  earn: "interest",
  interest: "interest",
  sends: "activity",
  send: "home",
  payment: "agent",
  payments: "agent",
  you: "agent",
  settings: "agent",
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
  const [sendPrefill, setSendPrefill] = useState<SendPrefill | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

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
      : tab === "agent"
        ? "Agent Settings"
        : tab === "interest"
          ? "Interest"
          : (TABS.find((t) => t.id === tab)?.label ?? "Basemate");

  const openSend = useCallback((prefill?: SendPrefill | null) => {
    setSendPrefill(prefill ?? null);
    setSendOpen(true);
  }, []);

  return (
    <div className="app-dashboard relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md">
        <MarkTile size={36} />
        <span className="font-app-display text-lg font-semibold tracking-tight">{activeTitle}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {tab === "home" && <HomeTab onSend={() => openSend(null)} />}
        {tab === "activity" && <ActivityTab onSendAgain={(p) => openSend(p)} />}
        {tab === "interest" && <InterestTab />}
        {tab === "contacts" && <ContactsTab onSendTo={(p) => openSend(p)} />}
        {tab === "agent" && <AgentSettingsTab />}
      </main>

      <SendSheet
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        prefill={sendPrefill}
        onSuccess={() => selectTab("activity")}
        onNeedDeposit={(amount) => {
          setSendOpen(false);
          selectTab("home");
          window.dispatchEvent(new CustomEvent("basemate:deposit-preset", { detail: { amount } }));
        }}
      />

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 min-h-[44px]"
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
    <div className="mb-2.5 mt-7 flex items-center justify-between px-0.5 first:mt-0">
      <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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
    <div className={`rounded-2xl border border-border bg-card px-4 py-3.5 ${className}`}>{children}</div>
  );
}

/** Grouped list inside one card (avoids “empty wide bars”). */
function Stack({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`app-stack overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}

function StackRow({
  children,
  className = "",
  bordered,
}: {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${bordered ? "border-t border-border" : ""} ${className}`}>
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
  coins: Array<{
    id: string;
    symbol: string;
    name: string | null;
    amount: string;
    valueUsd: number;
    imageUrl: string | null;
    tokenAddress: string | null;
  }>;
  staking: Array<{ id: string; protocol: string; asset: string; valueUsd: number | null; apy: number | null }>;
  user: { wallets: string[] };
}

/** WETH on Base — used as the logo source for native ETH (no contract). */
const WETH_BASE_ADDRESS = "0x4200000000000000000000000000000000000006";

/** Known logos we ship locally — DexScreener often has no icon for majors like USDC. */
const LOCAL_TOKEN_LOGOS: Record<string, string> = {
  USDC: "/brand/tokens/usdc.png",
  USDBC: "/brand/tokens/usdc.png",
};

/** DexScreener token-icon CDN for a Base token, or null when we can't resolve one. */
function tokenLogoUrl(symbol: string, tokenAddress: string | null): string | null {
  const s = symbol.toUpperCase();
  if (LOCAL_TOKEN_LOGOS[s]) return LOCAL_TOKEN_LOGOS[s];
  const address =
    s === "ETH" || s === "WETH" ? WETH_BASE_ADDRESS : tokenAddress?.toLowerCase() ?? null;
  if (!address) return null;
  return `https://dd.dexscreener.com/ds-data/tokens/base/${address}.png`;
}

/** Token avatar: real logo when available, graceful letter fallback on miss. */
function TokenIcon({
  symbol,
  tokenAddress,
  imageUrl,
}: {
  symbol: string;
  tokenAddress: string | null;
  imageUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl ?? tokenLogoUrl(symbol, tokenAddress);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-9 w-9 shrink-0 rounded-full bg-muted object-cover"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {symbol.slice(0, 3)}
    </div>
  );
}

function HomeTab({ onSend }: { onSend: () => void }) {
  const { data, loading } = useApi<PortfolioPayload>("/api/app/portfolio");
  const total = data?.totals?.totalUsd ?? 0;
  const stakingUsd = data?.totals?.stakingUsd ?? 0;
  const coins = data?.coins ?? [];
  const staking = data?.staking ?? [];

  return (
    <>
      <section className="app-hero relative overflow-hidden rounded-3xl p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Total balance
        </p>
        {loading ? (
          <Skeleton className="mt-3 h-12 w-40 rounded-xl" />
        ) : (
          <p className="mt-2 font-app-display text-5xl font-bold leading-none tracking-tight tabular-nums">
            {usd(total)}
          </p>
        )}
        {stakingUsd > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-up/10 px-2.5 py-1 text-xs font-semibold text-up">
            <Sparkles className="h-3.5 w-3.5" /> {usd(stakingUsd)} earning
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <AddFundsButton />
          <button
            type="button"
            onClick={onSend}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--app-shadow-mark)] transition active:scale-[0.99]"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </section>

      <SectionLabel>Holdings</SectionLabel>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : coins.length === 0 && staking.length === 0 ? (
        <Empty text="No tokens yet — add funds to get started." />
      ) : (
        <Stack>
          {coins.map((c, i) => (
            <StackRow key={c.id} bordered={i > 0}>
              <TokenIcon symbol={c.symbol} tokenAddress={c.tokenAddress} imageUrl={c.imageUrl} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.symbol}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {Number(c.amount).toLocaleString()} {c.symbol}
                </p>
              </div>
              <p className="shrink-0 app-money text-sm font-semibold">{usd(c.valueUsd)}</p>
            </StackRow>
          ))}
          {staking.map((s, j) => (
            <StackRow key={s.id} bordered={coins.length > 0 || j > 0}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-up/15 text-up">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize">
                  {s.asset} · Moonwell
                </p>
                {s.apy != null && (
                  <p className="font-mono text-xs font-semibold text-up tabular-nums">{s.apy.toFixed(2)}% APY</p>
                )}
              </div>
              <p className="shrink-0 app-money text-sm font-semibold">{usd(s.valueUsd)}</p>
            </StackRow>
          ))}
        </Stack>
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
  const preview = useAppPreviewMode();
  if (preview) {
    return <AddFundsButtonInner email="" />;
  }
  return <AddFundsButtonWithCdp />;
}

function AddFundsButtonWithCdp() {
  const { currentUser } = useCurrentUser();
  const email = currentUser?.authenticationMethods?.email?.email ?? "";
  return <AddFundsButtonInner email={email} />;
}

function AddFundsButtonInner({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    function onPreset(e: Event) {
      const detail = (e as CustomEvent<{ amount?: string }>).detail;
      const next = detail?.amount?.trim();
      if (!next) return;
      setAmount(next);
      setOpen(true);
    }
    window.addEventListener("basemate:deposit-preset", onPreset);
    return () => window.removeEventListener("basemate:deposit-preset", onPreset);
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funded, setFunded] = useState(false);
  const [session, setSession] = useState<{
    paymentLinkOptions: FundPayOption[];
    hostedFallbackUrl?: string;
    expiresAt: string;
    headlessBlockedReason?: string;
    limitUpgradeEligible?: boolean;
  } | null>(null);

  const numericAmount = Number(amount);
  const canContinue = Number.isFinite(numericAmount) && numericAmount >= 2;

  function close() {
    if (busy) return;
    setOpen(false);
    setSession(null);
    setError(null);
    setAmount("");
    setFunded(false);
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
      const paymentLinkOptions = (body?.paymentLinkOptions ?? []) as FundPayOption[];
      const hostedFallbackUrl =
        typeof body?.hostedFallbackUrl === "string" ? body.hostedFallbackUrl : undefined;
      if (!paymentLinkOptions.length && !hostedFallbackUrl && !body?.limitUpgradeEligible) {
        throw new Error(body?.error ?? "Couldn't start checkout.");
      }
      setSession({
        paymentLinkOptions,
        hostedFallbackUrl,
        expiresAt: body.expiresAt as string,
        headlessBlockedReason:
          typeof body.headlessBlockedReason === "string" ? body.headlessBlockedReason : undefined,
        limitUpgradeEligible: body.limitUpgradeEligible === true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Add funds.");
    } finally {
      setBusy(false);
    }
  }

  async function refetchFundSession() {
    if (!Number.isFinite(numericAmount) || numericAmount < 2) return;
    const q = new URLSearchParams({ amount: String(numericAmount) });
    if (email) q.set("email", email);
    const res = await fetch(`/api/app/fund-session?${q.toString()}`, { cache: "no-store" });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
    setSession({
      paymentLinkOptions: (body?.paymentLinkOptions ?? []) as FundPayOption[],
      hostedFallbackUrl:
        typeof body?.hostedFallbackUrl === "string" ? body.hostedFallbackUrl : undefined,
      expiresAt: body.expiresAt as string,
      headlessBlockedReason:
        typeof body.headlessBlockedReason === "string" ? body.headlessBlockedReason : undefined,
      limitUpgradeEligible: body.limitUpgradeEligible === true,
    });
  }

  async function requestLimitUpgradeUrl() {
    const res = await fetch("/api/app/limit-upgrade-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? "Could not start limit upgrade.");
    if (!body.upgradeUrl) throw new Error("Missing upgrade URL.");
    return { upgradeUrl: body.upgradeUrl as string, expiresAt: body.expiresAt as string };
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-border bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" /> Deposit
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
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">Add funds</p>
              {session && (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {session ? (
              <div className="mt-4">
                <OnrampPaymentFrame
                  flow="onramp"
                  layout="modal"
                  paymentLinkOptions={session.paymentLinkOptions}
                  expiresAt={session.expiresAt}
                  onSuccess={() => {
                    setFunded(true);
                    void fetch("/api/app/record-funding", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ amount: numericAmount }),
                    }).catch(() => {});
                  }}
                />
                <button
                  type="button"
                  onClick={close}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.99] ${
                    funded
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {funded ? <Check className="h-4 w-4" /> : null}
                  {funded ? "Done — back to home" : "Close"}
                </button>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buy USDC on Base with Apple Pay, Google Pay, or card on Coinbase. Minimum $2.
                </p>
                <label className="mt-5 block">
                  <span className="sr-only">Amount in USD</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary px-4 py-3">
                    <span className="font-display text-2xl font-bold text-muted-foreground">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="2"
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

function Empty({
  text,
  action,
}: {
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-border/60 bg-card/40 px-6 py-10 text-center">
      <BubbleMarkTile size={88} tilt animate />
      <p className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

type ClaimState = "unclaimed" | "claimed" | "returned" | "sent";

interface ActivityItem {
  id: string;
  kind: "send" | "activity";
  activityType: string;
  label: string | null;
  amount: string | null;
  asset: string | null;
  memo: string | null;
  status: string;
  explorerUrl: string | null;
  recipientPhone: string | null;
  recipientName: string | null;
  claimState: ClaimState | null;
  claimDetail: string | null;
  claimExpiresAt: string | null;
  createdAt: string;
}

function ClaimPill({ state }: { state: ClaimState }) {
  const label =
    state === "unclaimed"
      ? "Unclaimed"
      : state === "claimed"
        ? "Claimed"
        : state === "returned"
          ? "Returned"
          : "Sent";
  const cls =
    state === "unclaimed"
      ? "bg-amber-500/15 text-amber-600"
      : state === "claimed" || state === "sent"
        ? "bg-up/15 text-up"
        : "bg-destructive/15 text-destructive";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{label}</span>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = status === "confirmed";
  const bad = status === "failed" || status === "expired";
  const label = ok ? "Confirmed" : bad ? status : status;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${ok ? "bg-up/15 text-up" : bad ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
        }`}
    >
      {label}
    </span>
  );
}

function activityHeadline(t: ActivityItem): string {
  const isSend = t.kind === "send";
  if (isSend) {
    const who = t.recipientName ?? t.recipientPhone ?? "them";
    if (t.claimState === "unclaimed") return `${who} hasn't claimed yet`;
    if (t.claimState === "claimed") return `${who} claimed your send`;
    if (t.claimState === "returned") return `Send to ${who} returned`;
    return `Sent to ${who}`;
  }
  if (t.label) return t.label;
  const type = t.activityType ?? "onchain";
  if (type === "swap") return "Swap";
  if (type === "yield") return "Yield deposit";
  if (type === "fund") return "Added funds";
  if (type === "trade") return "Trade";
  return "Transaction";
}

function activityStatusChip(t: ActivityItem): React.ReactNode {
  if (t.kind === "send" && t.claimState) return <ClaimPill state={t.claimState} />;
  return <StatusPill status={t.status} />;
}

function ActivityRow({
  t,
  onSendAgain,
}: {
  t: ActivityItem;
  onSendAgain: (prefill: SendPrefill) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSend = t.kind === "send";
  const headline = activityHeadline(t);
  const hasDetails =
    Boolean(t.memo) ||
    Boolean(t.claimDetail) ||
    Boolean(t.explorerUrl) ||
    (isSend && t.claimState === "unclaimed" && Boolean(t.claimExpiresAt)) ||
    Boolean(t.activityType);

  return (
    <Row className="shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug">{headline}</p>
          {t.amount && (
            <p className="mt-1 app-money text-lg font-semibold text-foreground">
              {t.amount} {t.asset}
            </p>
          )}
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">{fmtDateTime(t.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {activityStatusChip(t)}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary"
              aria-expanded={open}
            >
              {open ? "Less" : "Details"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          {t.activityType && (
            <p>
              <span className="font-medium text-foreground">Type:</span>{" "}
              {t.activityType.charAt(0).toUpperCase() + t.activityType.slice(1)}
            </p>
          )}
          {t.claimDetail && <p className="leading-relaxed">{t.claimDetail}</p>}
          {isSend && t.claimState === "unclaimed" && t.claimExpiresAt && (
            <p>Claim by {fmtDateTime(t.claimExpiresAt)}</p>
          )}
          {t.memo && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-secondary-foreground">&ldquo;{t.memo}&rdquo;</p>
          )}
          {t.explorerUrl && (
            <a
              href={t.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary"
            >
              Basescan <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {isSend && t.recipientPhone && (
        <button
          type="button"
          onClick={() =>
            onSendAgain({
              name: t.recipientName ?? undefined,
              phone: t.recipientPhone ?? undefined,
              amount: t.amount ?? undefined,
            })
          }
          className="mt-3 text-xs font-semibold text-primary/80 underline-offset-2 hover:text-primary hover:underline"
        >
          Send again
        </button>
      )}
    </Row>
  );
}

function ActivityTab({ onSendAgain }: { onSendAgain: (prefill: SendPrefill) => void }) {
  const { data, loading } = useApi<{ items: ActivityItem[] }>("/api/app/activity");
  if (loading) return <ListSkeleton />;
  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <Empty
        text="Nothing here yet. Send from Home and your transfers show up here."
        action={
          <p className="text-xs text-muted-foreground">Use the Send button on Home to get started.</p>
        }
      />
    );
  }
  return (
    <div className="space-y-2.5">
      {items.map((t) => (
        <ActivityRow key={t.id} t={t} onSendAgain={onSendAgain} />
      ))}
    </div>
  );
}

interface InterestRate {
  group?: "moonwell" | "corridor";
  symbol: string;
  name: string;
  peg: string;
  issuer: string;
  protocol: string | null;
  asset: string;
  apy: number | null;
  address: string;
  depositable: boolean;
}

function InterestTab() {
  const { data, loading, reload } = useApi<{ items: InterestRate[] }>("/api/app/yield/rates");
  const items = data?.items ?? [];
  const moonwellRows =
    items.filter((v) => v.group === "moonwell").length > 0
      ? items.filter((v) => v.group === "moonwell")
      : items.filter((v) => v.protocol === "moonwell" || v.depositable);
  const corridorRows = items.filter((v) => v.group === "corridor");

  return (
    <>
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground shadow-[var(--shadow-card)]">
        Earn on <span className="font-semibold text-foreground">Moonwell</span> — USDC, ETH, and BTC. Tap{" "}
        <span className="font-semibold text-primary">Deposit</span>; Basemate covers gas.
      </div>

      <SectionLabel>Moonwell</SectionLabel>
      {loading ? (
        <ListSkeleton />
      ) : moonwellRows.length === 0 ? (
        <Empty text="Deposit USDC on Home, then come back to earn." />
      ) : (
        <Stack>
          {moonwellRows.map((v, i) => (
            <StackRow key={`mw-${v.asset}`} bordered={i > 0} className="justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{v.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {v.depositable && v.apy != null
                    ? `${v.apy.toFixed(2)}% APY · Moonwell`
                    : "APY unavailable · Moonwell"}
                </p>
              </div>
              {v.depositable ? (
                <DepositButton rate={v} onDone={reload} />
              ) : (
                <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
                  —
                </span>
              )}
            </StackRow>
          ))}
        </Stack>
      )}

      {corridorRows.length > 0 && (
        <>
          <SectionLabel>More stablecoins</SectionLabel>
          <div className="space-y-2">
            {corridorRows.map((v) => (
              <Row key={`cor-${v.symbol}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {v.symbol}{" "}
                    <span className="font-normal text-muted-foreground">· {v.peg}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Interest coming soon{v.issuer ? ` · ${v.issuer}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
                  Soon
                </span>
              </Row>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function DepositButton({ rate, onDone }: { rate: InterestRate; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const canDeposit = Number.isFinite(numericAmount) && numericAmount > 0;

  function close() {
    if (busy) return;
    setOpen(false);
    setAmount("");
    setError(null);
    setTxHash(null);
  }

  async function deposit() {
    if (!canDeposit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/app/yield/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ asset: rate.asset, amount }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      setTxHash(body?.txHash ?? "");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't complete your deposit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.99]"
      >
        Deposit
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-xl)] bg-card p-6 shadow-[var(--shadow-modal)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-app-display text-lg font-bold">Deposit {rate.asset}</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {txHash !== null ? (
              <div className="mt-5 flex flex-col items-center gap-3 text-center">
                <BubbleMarkTile size={88} animate />
                <p className="text-sm font-semibold">
                  Deposited {amount} {rate.asset} to Moonwell
                </p>
                <p className="text-xs text-muted-foreground">
                  You&apos;re now earning {rate.apy != null ? `${rate.apy.toFixed(2)}%` : ""} APY. It&apos;ll show
                  under Earning in your portfolio shortly.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  <Check className="h-4 w-4" /> Done
                </button>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supply {rate.asset} to Moonwell and start earning{" "}
                  {rate.apy != null ? `${rate.apy.toFixed(2)}%` : ""} APY. Gas is on us.
                </p>
                <label className="mt-5 block">
                  <span className="sr-only">Amount in {rate.asset}</span>
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary px-4 py-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      autoFocus
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") deposit();
                      }}
                      className="w-full bg-transparent font-display text-2xl font-bold tabular-nums outline-none"
                    />
                    <span className="font-display text-lg font-bold text-muted-foreground">
                      {rate.asset}
                    </span>
                  </div>
                </label>
                {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
                <button
                  type="button"
                  onClick={deposit}
                  disabled={!canDeposit || busy}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Depositing…" : `Deposit ${rate.asset}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface ContactItem {
  id?: string;
  name: string;
  phone: string | null;
}

function ContactsTab({ onSendTo }: { onSendTo: (prefill: SendPrefill) => void }) {
  const { data, loading, reload } = useApi<{ items: ContactItem[] }>("/api/app/contacts");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canImport =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    typeof (navigator as { contacts?: { select?: unknown } }).contacts?.select === "function";

  async function addContact() {
    if (!name.trim() || !phone.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/app/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not save contact.");
      setName("");
      setPhone("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save contact.");
    } finally {
      setBusy(false);
    }
  }

  async function importFromPhone() {
    if (!canImport || busy) return;
    setBusy(true);
    setError(null);
    try {
      type ContactPicker = { name?: string[]; tel?: string[] };
      const props: ("name" | "tel")[] = ["name", "tel"];
      const picked = (await (
        navigator as unknown as { contacts: { select: (p: typeof props, o: { multiple: boolean }) => Promise<ContactPicker[]> } }
      ).contacts.select(props, { multiple: true })) as ContactPicker[];
      const batch = picked
        .map((c) => ({
          name: c.name?.[0]?.trim() ?? "",
          phone: c.tel?.[0]?.trim() ?? "",
        }))
        .filter((c) => c.name && c.phone);
      if (!batch.length) return;
      const res = await fetch("/api/app/contacts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contacts: batch }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Import failed.");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const items = data?.items ?? [];

  return (
    <>
      {canImport && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void importFromPhone()}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold"
        >
          Import from phone
        </button>
      )}

      <SectionLabel>Add contact</SectionLabel>
      <Row>
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (+1…)"
            className="w-full rounded-full border border-border bg-background px-4 py-2 font-mono text-sm outline-none"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="button"
            disabled={busy || !name.trim() || !phone.trim()}
            onClick={() => void addContact()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save contact
          </button>
        </div>
      </Row>

      <SectionLabel>Saved</SectionLabel>
      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <Empty text="No contacts yet. Add a name and phone, then send from Home." />
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <button
              key={c.id ?? c.phone}
              type="button"
              onClick={() => onSendTo({ name: c.name, phone: c.phone ?? undefined })}
              className="w-full text-left"
              disabled={!c.phone}
            >
              <Row className="transition active:scale-[0.99]">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{c.phone}</p>
              </Row>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

interface Prefs {
  payMode: "manual" | "quick";
  autoSendLimitUsd: number;
}

function AgentSettingsTab() {
  const preview = useAppPreviewMode();
  if (preview) {
    return <AgentSettingsTabInner />;
  }
  return <AgentSettingsTabWithCdp />;
}

function AgentSettingsTabWithCdp() {
  const { signOut } = useSignOut();
  return <AgentSettingsTabInner onSignOutCdp={() => signOut()} />;
}

function AgentSettingsTabInner({ onSignOutCdp }: { onSignOutCdp?: () => Promise<void> }) {
  const { data, loading, reload } = useApi<Prefs>("/api/app/preferences");
  const { data: profile } = useApi<{ displayName: string | null; basename: string | null; embeddedAddress: string | null; delegation: { active: boolean; expiresAt: string | null } | null }>("/api/app/profile");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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

      <SectionLabel>Payments in chat</SectionLabel>
      <Row>
        <p className="text-sm font-semibold">Confirmation</p>
        <p className="mt-1 text-xs text-muted-foreground">
          In chat: confirm every payment, or send automatically under your limit. Sends on this website always ask
          you to confirm.
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
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          try {
            if (onSignOutCdp) await onSignOutCdp();
            await fetch("/api/app/session", { method: "DELETE" });
            window.location.reload();
          } finally {
            setSigningOut(false);
          }
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border/60 px-6 py-3 text-sm font-medium text-muted-foreground transition active:scale-[0.99] disabled:opacity-60"
      >
        {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}
