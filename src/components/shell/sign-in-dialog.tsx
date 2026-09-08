"use client";

import { useCallback, useEffect, useState } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCurrentUser,
  useGetAccessToken,
  useIsSignedIn,
  useSignInWithEmail,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import { Loader2, X } from "lucide-react";

import { cdpConfig } from "@/lib/cdp-config";

/**
 * Sign-in as an overlay rather than a route.
 *
 * The old gate replaced the page with a link to /app, so anyone who hit a
 * gated iStonks page lost their place and had to navigate back by hand. This
 * keeps the page underneath mounted and refreshes it once the session lands.
 */

type Phase = "email" | "otp" | "linking" | "error";

export function SignInDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  if (!open) return null;
  return (
    <CDPReactProvider config={cdpConfig}>
      <SignInDialogInner onClose={onClose} onSuccess={onSuccess} />
    </CDPReactProvider>
  );
}

function SignInDialogInner({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { getAccessToken } = useGetAccessToken();

  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const linkSession = useCallback(async () => {
    if (!currentUser) return;
    setPhase("linking");
    try {
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
      if (onSuccess) onSuccess();
      else window.location.reload();
    } catch (err) {
      setPhase("error");
      const raw = err instanceof Error ? err.message : "Sign-in failed.";
      setMessage(
        /no basemate account is linked|not linked|connect it from basemate/i.test(raw)
          ? "No Basemate account is linked to this email yet. Text Basemate in iMessage to set up first, then come back."
          : raw,
      );
    }
  }, [currentUser, getAccessToken, onSuccess]);

  // A CDP session may already exist from /app or /wallet/connect — link it
  // rather than asking for an email we don't need.
  useEffect(() => {
    if ((phase === "email" || phase === "otp") && isSignedIn) setPhase("linking");
  }, [phase, isSignedIn]);

  useEffect(() => {
    if (phase === "linking" && isSignedIn && currentUser) void linkSession();
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
      if (/already authenticated|already signed in/i.test(msg)) {
        setPhase("linking");
        return;
      }
      setMessage(
        /network error|failed to fetch|load failed/i.test(msg)
          ? "Couldn't reach sign-in (Coinbase). Check your connection and try again."
          : msg,
      );
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[400px] rounded-[22px] bg-card p-6 shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to Basemate"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">Sign in</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {phase === "otp"
                ? `Enter the code we sent to ${email}.`
                : "Use the email you set up with Basemate in iMessage."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5">
          {phase === "linking" ? (
            <p className="flex items-center gap-2 py-2 text-[14px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Signing you in…
            </p>
          ) : phase === "otp" ? (
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && submitOtp()}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              autoFocus
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center font-mono text-[19px] tracking-[0.3em] outline-none transition-colors focus:border-primary"
            />
          ) : (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEmail()}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              autoFocus
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-[15px] outline-none transition-colors focus:border-primary"
            />
          )}

          {message && (
            <p className="mt-3 text-[13px] leading-relaxed text-destructive">{message}</p>
          )}

          {phase !== "linking" && (
            <button
              type="button"
              onClick={phase === "otp" ? submitOtp : submitEmail}
              disabled={busy || (phase === "otp" ? otp.length < 6 : !email)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-[15px] font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : phase === "otp" ? "Verify" : "Send code"}
            </button>
          )}

          {phase === "otp" && !busy && (
            <button
              type="button"
              onClick={() => {
                setPhase("email");
                setOtp("");
                setMessage("");
              }}
              className="mt-3 w-full text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Use a different email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
