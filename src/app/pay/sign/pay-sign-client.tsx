"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCurrentUser,
  useGetAccessToken,
  useIsSignedIn,
  useSignInWithEmail,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

type PendingPay = {
  label: string | null;
  recipientDisplay: string | null;
  amount: string | null;
  tokenSymbol: string | null;
  status: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "auth" }
  | { status: "ready"; pending: PendingPay }
  | { status: "signing"; pending: PendingPay }
  | { status: "done" }
  | { status: "error"; message: string };

const LOGO_URL =
  "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png";
const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "213ae300-ae45-48ba-b2c0-823126466b83";
const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "Basemate",
  appLogoUrl: LOGO_URL,
  ethereum: { createOnLogin: "smart" as const },
};

type AuthPhase = "email" | "otp" | "linking" | "error";

class PayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requiresAuth: boolean,
  ) {
    super(message);
  }
}

export function PaySignClient({ token }: { token: string }) {
  return (
    <CDPReactProvider config={cdpConfig}>
      <PaySignInner token={token} />
    </CDPReactProvider>
  );
}

function PaySignInner({ token }: { token: string }) {
  const router = useRouter();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [authPhase, setAuthPhase] = useState<AuthPhase>("email");
  const [authMessage, setAuthMessage] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pay/sign?s=${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new PayApiError(
            body?.error || "Could not load this payment.",
            res.status,
            body?.requiresAuth === true,
          );
        }
        return body as PendingPay;
      })
      .then((pending) => {
        if (cancelled) return;
        setLoad(pending.status === "signed" ? { status: "done" } : { status: "ready", pending });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof PayApiError && err.status === 401 && err.requiresAuth) {
          setAuthMessage("");
          setAuthPhase(isSignedIn ? "linking" : "email");
          setLoad({ status: "auth" });
          return;
        }
        setLoad({ status: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, loadAttempt, token]);

  const linkSession = useCallback(async () => {
    if (!currentUser) return;
    setAuthPhase("linking");
    setAuthMessage("");
    try {
      const raw = (await getAccessToken()) as unknown;
      const accessToken =
        typeof raw === "string" ? raw : (raw as { accessToken?: string })?.accessToken;
      if (!accessToken) throw new Error("Could not read your Basemate session.");
      const res = await fetch("/api/app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Sign-in failed.");
      setLoad({ status: "loading" });
      setLoadAttempt((attempt) => attempt + 1);
    } catch (err) {
      setAuthPhase("error");
      setAuthMessage(err instanceof Error ? err.message : "Sign-in failed.");
      setLoad({ status: "auth" });
    }
  }, [currentUser, getAccessToken]);

  useEffect(() => {
    if (load.status === "auth" && authPhase === "linking" && isSignedIn && currentUser) {
      const timer = window.setTimeout(() => void linkSession(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [authPhase, currentUser, isSignedIn, linkSession, load.status]);

  async function submitEmail() {
    if (!email) return;
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const result = await signInWithEmail({ email });
      setFlowId(result.flowId);
      setAuthPhase("otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send the code.";
      if (/already authenticated|already signed in/i.test(message)) {
        setAuthPhase("linking");
      } else {
        setAuthMessage(message);
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitOtp() {
    if (!flowId || !otp) return;
    setAuthBusy(true);
    setAuthMessage("");
    try {
      await verifyEmailOTP({ flowId, otp });
      setAuthPhase("linking");
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : "That code did not work.");
    } finally {
      setAuthBusy(false);
    }
  }

  const confirm = useCallback(async () => {
    if (load.status !== "ready") return;
    const pending = load.pending;
    setLoad({ status: "signing", pending });
    try {
      const res = await fetch("/api/pay/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401 && body?.requiresAuth === true) {
          setAuthMessage("");
          setAuthPhase(isSignedIn ? "linking" : "email");
          setLoad({ status: "auth" });
          return;
        }
        throw new Error(body?.error || "Could not complete this transaction.");
      }
      setLoad({ status: "done" });
      router.replace("/pay/success");
    } catch (err) {
      setLoad({
        status: "error",
        message: err instanceof Error ? err.message : "Could not complete this transaction.",
      });
    }
  }, [isSignedIn, load, router, token]);

  const pending = load.status === "ready" || load.status === "signing" ? load.pending : null;

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-6 text-center sm:px-6">
      <div className="w-full rounded-xl border border-border/60 bg-card/80 p-6 backdrop-blur-md sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Wallet className="h-6 w-6" />
        </div>

        {load.status === "loading" ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading your payment…</p>
          </div>
        ) : load.status === "auth" ? (
          <div className="mt-5 w-full">
            <h1 className="font-display text-xl font-bold tracking-tight">Verify it is you</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with the email connected to your Basemate wallet.
            </p>
            {authPhase === "linking" ? (
              <div className="mt-5 flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Verifying your account…</p>
              </div>
            ) : authPhase === "otp" ? (
              <div className="mt-5">
                <input
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="123456"
                  aria-label="Email verification code"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg tracking-widest"
                />
                {authMessage ? <p className="mt-2 text-sm text-destructive">{authMessage}</p> : null}
                <button
                  type="button"
                  onClick={submitOtp}
                  disabled={authBusy || otp.length < 6}
                  className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify
                </button>
              </div>
            ) : authPhase === "error" ? (
              <div className="mt-5">
                <p className="text-sm text-destructive">{authMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMessage("");
                    setAuthPhase("email");
                  }}
                  className="mt-4 min-h-[44px] w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3"
                />
                {authMessage ? <p className="mt-2 text-sm text-destructive">{authMessage}</p> : null}
                <button
                  type="button"
                  onClick={submitEmail}
                  disabled={authBusy || !email}
                  className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Send code
                </button>
              </div>
            )}
          </div>
        ) : load.status === "error" ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <AlertCircle className="h-9 w-9 text-destructive" />
            <p className="max-w-sm text-sm font-medium">{load.message}</p>
          </div>
        ) : load.status === "done" ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-9 w-9 text-up" />
            <p className="font-semibold">Payment sent</p>
            <p className="text-sm text-muted-foreground">You can close this page and head back to Basemate.</p>
          </div>
        ) : (
          <div className="w-full">
            <h1 className="mt-4 font-display text-xl font-bold tracking-tight sm:text-2xl">
              {pending?.label ?? "Confirm your payment"}
            </h1>
            {pending?.amount && pending?.tokenSymbol ? (
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
                <p className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                  {pending.amount}{" "}
                  <span className="text-base text-muted-foreground sm:text-lg">{pending.tokenSymbol}</span>
                </p>
                {pending.recipientDisplay ? (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">to {pending.recipientDisplay}</p>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={confirm}
              disabled={load.status === "signing"}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {load.status === "signing" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {load.status === "signing" ? "Confirming…" : "Confirm"}
            </button>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Review the details above, then tap Confirm. Basemate signs from your embedded wallet and covers the gas — no wallet popups.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
