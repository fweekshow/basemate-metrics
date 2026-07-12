"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCurrentUser,
  useEvmSmartAccounts,
  useIsSignedIn,
  useSignInWithEmail,
  useSignEvmMessage,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Loader2,
  Send,
  Settings,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";

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
  const { evmSmartAccounts } = useEvmSmartAccounts();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { signEvmMessage } = useSignEvmMessage();

  const [phase, setPhase] = useState<AuthPhase>("checking");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const smartAddress = useMemo((): string | undefined => {
    const smart = evmSmartAccounts?.[0] as unknown;
    if (typeof smart === "string") return smart;
    if (smart && typeof smart === "object" && "address" in smart) {
      return (smart as { address?: string }).address;
    }
    return undefined;
  }, [evmSmartAccounts]);

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
    if (!smartAddress || !currentUser) return;
    setPhase("linking");
    try {
      const nonce = Math.random().toString(36).slice(2);
      const issuedAt = new Date().toISOString();
      const message = `Sign in to Basemate\n\nAddress: ${smartAddress}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
      const result = (await signEvmMessage({
        evmAccount: smartAddress as `0x${string}`,
        message,
      } as never)) as { signature?: string } | string;
      const signature = typeof result === "string" ? result : result?.signature;
      if (!signature) throw new Error("Couldn't sign the sign-in message.");

      const res = await fetch("/api/app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: smartAddress, message, signature }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Sign-in failed.");
      setPhase("ready");
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Sign-in failed.");
    }
  }, [smartAddress, currentUser, signEvmMessage]);

  // Once the wallet is provisioned after email verification, link the session.
  useEffect(() => {
    if (phase === "linking" && isSignedIn && smartAddress && currentUser) {
      void linkSession();
    }
  }, [phase, isSignedIn, smartAddress, currentUser, linkSession]);

  async function submitEmail() {
    if (!email) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setPhase("otp");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn't send the code.");
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Wallet className="h-7 w-7" />
      </div>
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
            onClick={() => setPhase("email")}
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

function Dashboard() {
  const [tab, setTab] = useState<Tab>("home");
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background">
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6">
        {tab === "home" && <HomeTab />}
        {tab === "activity" && <ActivityTab />}
        {tab === "earn" && <EarnTab />}
        {tab === "sends" && <SendsTab />}
        {tab === "bets" && <BetsTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md items-center justify-around border-t border-border/60 bg-background/90 backdrop-blur-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
              tab === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-display text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function usd(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

interface PortfolioPayload {
  totals: { totalUsd: number; coinsUsd: number; stakingUsd: number };
  coins: Array<{ id: string; symbol: string; name: string | null; amount: string; valueUsd: number; imageUrl: string | null }>;
  staking: Array<{ id: string; protocol: string; asset: string; valueUsd: number | null; apy: number | null }>;
  user: { wallets: string[] };
}

function HomeTab() {
  const { data, loading } = useApi<PortfolioPayload>("/api/app/portfolio");
  if (loading) return <Loading />;
  const total = data?.totals?.totalUsd ?? 0;
  return (
    <>
      <section className="mb-6 rounded-2xl border border-border/60 bg-card p-5">
        <p className="text-sm text-muted-foreground">Total balance</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight">{usd(total)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <ReceiveButton />
          <a href="/pay" className="flex flex-col items-center gap-1 rounded-xl border border-border/60 py-3 text-xs font-medium">
            <ArrowUpRight className="h-4 w-4" /> Add funds
          </a>
          <a href="/pay/offramp" className="flex flex-col items-center gap-1 rounded-xl border border-border/60 py-3 text-xs font-medium">
            <ArrowDownToLine className="h-4 w-4" /> Cash out
          </a>
        </div>
      </section>

      <Panel title="Tokens">
        <div className="space-y-2">
          {(data?.coins ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
              <div className="flex items-center gap-3">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.symbol} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">{c.symbol.slice(0, 3)}</div>
                )}
                <div>
                  <p className="text-sm font-semibold">{c.symbol}</p>
                  <p className="text-xs text-muted-foreground">{Number(c.amount).toLocaleString()} {c.symbol}</p>
                </div>
              </div>
              <p className="text-sm font-medium">{usd(c.valueUsd)}</p>
            </div>
          ))}
          {(data?.coins ?? []).length === 0 && <Empty text="No tokens yet. Add funds to get started." />}
        </div>
      </Panel>

      {(data?.staking ?? []).length > 0 && (
        <Panel title="Earning">
          <div className="space-y-2">
            {data!.staking.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold capitalize">{s.protocol} · {s.asset}</p>
                  {s.apy != null && <p className="text-xs text-up">{(s.apy * 100).toFixed(2)}% APY</p>}
                </div>
                <p className="text-sm font-medium">{usd(s.valueUsd)}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function ReceiveButton() {
  const { data } = useApi<{ embeddedAddress: string | null }>("/api/app/profile");
  const [open, setOpen] = useState(false);
  const address = data?.embeddedAddress ?? "";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 rounded-xl border border-border/60 py-3 text-xs font-medium"
      >
        <ArrowDownToLine className="h-4 w-4 rotate-180" /> Receive
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-lg font-bold">Receive</p>
            <p className="mt-2 break-all rounded-xl border border-border/60 bg-background p-3 text-xs">{address || "—"}</p>
            {address && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                alt="QR"
                className="mx-auto mt-4 h-40 w-40 rounded-xl bg-white p-2"
              />
            )}
            <button
              type="button"
              onClick={() => { void navigator.clipboard?.writeText(address); }}
              className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Copy address
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">{text}</p>;
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
  if (loading) return <Loading />;
  const items = data?.items ?? [];
  return (
    <Panel title="Activity">
      {items.length === 0 ? (
        <Empty text="No transactions yet." />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="rounded-xl border border-border/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t.label ?? "Transaction"}</p>
                <StatusPill status={t.status} />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(t.createdAt).toLocaleString()}</span>
                {t.explorerUrl && (
                  <a href={t.explorerUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                    Basescan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = status === "confirmed";
  const bad = status === "failed" || status === "expired";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        ok ? "bg-up/15 text-up" : bad ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
      }`}
    >
      {status}
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
  if (loading) return <Loading />;
  const items = data?.items ?? [];
  return (
    <Panel title="Sends">
      {items.length === 0 ? (
        <Empty text="You haven't sent anyone money yet." />
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{s.recipientName ?? s.recipientPhone ?? "Recipient"}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{s.amount} {s.asset}</p>
                <StatusPill status={s.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
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
  if (loading) return <Loading />;
  const items = data?.items ?? [];
  return (
    <Panel title="Earn — best rates">
      {items.length === 0 ? (
        <Empty text="No yield opportunities available right now." />
      ) : (
        <div className="space-y-2">
          {items.map((v) => (
            <div key={v.address} className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{v.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{v.protocol} · {v.asset}</p>
              </div>
              <p className="text-sm font-semibold text-up">{v.apy != null ? `${(v.apy * 100).toFixed(2)}%` : "—"}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">Tell Basemate &quot;earn on USDC&quot; in chat to deposit.</p>
    </Panel>
  );
}

interface BetItem {
  id: string;
  match: string;
  pick: string;
  stakeBasemate: string;
  status: string;
  payoutUrl: string | null;
  kickoffAt: string;
}

function BetsTab() {
  const { data, loading } = useApi<{ items: BetItem[] }>("/api/app/worldcup/bets");
  if (loading) return <Loading />;
  const items = data?.items ?? [];
  return (
    <Panel title="World Cup">
      {items.length === 0 ? (
        <Empty text="No bets yet." />
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border border-border/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{b.match}</p>
                <StatusPill status={b.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                Pick: {b.pick} · {Number(b.stakeBasemate).toLocaleString()} BASEMATE
              </p>
              {b.payoutUrl && (
                <a href={b.payoutUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                  View payout
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
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

  if (loading) return <Loading />;
  const mode = data?.payMode ?? "manual";

  return (
    <>
      <Panel title="Account">
        <div className="rounded-xl border border-border/40 px-4 py-3 text-sm">
          <p className="font-semibold">{profile?.displayName ?? profile?.basename ?? "Basemate account"}</p>
          {profile?.embeddedAddress && (
            <p className="mt-1 break-all text-xs text-muted-foreground">{profile.embeddedAddress}</p>
          )}
          {profile?.delegation && (
            <p className="mt-2 text-xs text-muted-foreground">
              Auto-send authorization: {profile.delegation.active ? "active" : "expired"}
              {profile.delegation.expiresAt ? ` · until ${new Date(profile.delegation.expiresAt).toLocaleDateString()}` : ""}
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Payments">
        <div className="space-y-3">
          <div className="rounded-xl border border-border/40 p-4">
            <p className="text-sm font-semibold">Confirmation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose whether every payment needs a tap to confirm, or sends automatically.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => save({ payMode: "manual" })}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${mode === "manual" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}
              >
                Confirm each
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => save({ payMode: "quick" })}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${mode === "quick" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}
              >
                Automatic
              </button>
            </div>
          </div>

          {mode === "quick" && (
            <div className="rounded-xl border border-border/40 p-4">
              <p className="text-sm font-semibold">Auto-approve limit</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Payments above this amount still ask you to confirm.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">$</span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save({ autoSendLimitUsd: Number(limit) })}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </Panel>

      <button
        type="button"
        onClick={async () => {
          await fetch("/api/app/session", { method: "DELETE" });
          window.location.reload();
        }}
        className="w-full rounded-full border border-border/60 px-6 py-3 text-sm font-medium text-muted-foreground"
      >
        Sign out
      </button>
    </>
  );
}
