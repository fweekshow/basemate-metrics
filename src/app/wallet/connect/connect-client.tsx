"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CDPReactProvider } from "@coinbase/cdp-react";
import {
  useCreateDelegation,
  useCurrentUser,
  useEvmSmartAccounts,
  useIsSignedIn,
  useSignInWithEmail,
  useVerifyEmailOTP,
} from "@coinbase/cdp-hooks";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

const DELEGATION_DAYS = 90;
// Project ID is a public, client-side identifier. Prefer the env var; fall back
// to the Basemate project id so the page works even if the build arg isn't wired.
const PROJECT_ID =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "213ae300-ae45-48ba-b2c0-823126466b83";

const cdpConfig = {
  projectId: PROJECT_ID,
  appName: "Basemate",
  appLogoUrl: "https://res.cloudinary.com/dg5qvbxjp/image/upload/v1770196704/IMG_9007_iv7vkm.png",
  ethereum: { createOnLogin: "smart" as const },
};

export function ConnectClient({ sessionToken }: { sessionToken: string }) {
  if (!PROJECT_ID) {
    return (
      <Shell>
        <StatusBlock icon="error" message="Wallet setup is not configured (missing project id)." />
      </Shell>
    );
  }
  return (
    <CDPReactProvider config={cdpConfig}>
      <ConnectInner sessionToken={sessionToken} />
    </CDPReactProvider>
  );
}

type Phase = "loading" | "email" | "otp" | "finishing" | "done" | "error";

function ConnectInner({ sessionToken }: { sessionToken: string }) {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmSmartAccounts } = useEvmSmartAccounts();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { createDelegation } = useCreateDelegation();

  const [phase, setPhase] = useState<Phase>(sessionToken ? "loading" : "error");
  const [message, setMessage] = useState(
    sessionToken ? "" : "Missing setup link. Open the latest link from Basemate.",
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    fetch(`/api/wallet/connect?s=${encodeURIComponent(sessionToken)}`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Could not load setup.");
      })
      .then(() => {
        if (!cancelled) setPhase((p) => (p === "loading" ? "email" : p));
      })
      .catch((err) => {
        if (!cancelled) {
          setPhase("error");
          setMessage(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  const smartAddress = ((): string | undefined => {
    const smart = evmSmartAccounts?.[0] as unknown;
    if (typeof smart === "string") return smart;
    if (smart && typeof smart === "object" && "address" in smart) {
      return (smart as { address?: string }).address;
    }
    return undefined;
  })();

  const finishingRef = useRef(false);

  const finish = useCallback(async () => {
    const userId = currentUser?.userId;
    if (!userId || !smartAddress) return; // not ready yet; effect will retry
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      const lookupDelegation = async (): Promise<{ active: boolean; expiresAt: string | null }> => {
        const response = await fetch("/api/wallet/delegation", {
          method: "POST",
          cache: "no-store",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ token: sessionToken, userId, address: smartAddress }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result?.error || "Could not check your existing wallet authorization.");
        }
        return {
          active: result?.active === true,
          expiresAt: typeof result?.expiresAt === "string" ? result.expiresAt : null,
        };
      };

      const requestedExpiresAt = new Date(
        Date.now() + DELEGATION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      let delegationId: string | undefined;
      let delegationExpiresAt: string;
      const existing = await lookupDelegation();
      if (existing.active && existing.expiresAt) {
        delegationExpiresAt = existing.expiresAt;
      } else {
        try {
          const delegation = await createDelegation({ expiresAt: requestedExpiresAt });
          delegationId = (delegation as { delegationId?: string })?.delegationId;
          delegationExpiresAt =
            (delegation as { expiresAt?: string })?.expiresAt ?? requestedExpiresAt;
        } catch (err) {
          const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
          if (!message.includes("active delegation already exists")) throw err;
          const raced = await lookupDelegation();
          if (!raced.active || !raced.expiresAt) throw err;
          delegationExpiresAt = raced.expiresAt;
        }
      }

      const res = await fetch("/api/wallet/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: sessionToken,
          userId,
          address: smartAddress,
          delegationId,
          expiresAt: delegationExpiresAt,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not finish setup.");
      setPhase("done");
    } catch (err) {
      finishingRef.current = false; // allow retry
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Could not finish setup.");
    }
  }, [createDelegation, currentUser, smartAddress, sessionToken]);

  // If the SDK restored an existing session, skip the email form.
  useEffect(() => {
    if (phase === "email" && isSignedIn) setPhase("finishing");
  }, [phase, isSignedIn]);

  // After sign-in, once the smart account is provisioned, complete setup.
  useEffect(() => {
    if (phase === "finishing" && isSignedIn && smartAddress && currentUser?.userId) {
      void finish();
    }
  }, [phase, isSignedIn, smartAddress, currentUser, finish]);

  // Guard: don't hang forever waiting for the wallet to provision.
  useEffect(() => {
    if (phase !== "finishing") return;
    const t = setTimeout(() => {
      if (!finishingRef.current) {
        setPhase("error");
        setMessage("Your wallet is taking longer than expected to set up. Tap the link again to retry.");
      }
    }, 45_000);
    return () => clearTimeout(t);
  }, [phase]);

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
      setPhase("finishing"); // the effect completes delegation once the wallet is ready
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "That code didn't work — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      {phase === "loading" ? (
        <StatusBlock icon="spin" message="Loading…" />
      ) : phase === "error" ? (
        <StatusBlock icon="error" message={message} />
      ) : phase === "done" ? (
        <StatusBlock
          icon="ok"
          title="Basemate account ready"
          message="You can close this page and head back to Basemate — you're all set to send instantly."
        />
      ) : phase === "finishing" ? (
        <StatusBlock icon="spin" message="Setting up your account…" />
      ) : phase === "otp" ? (
        <div className="w-full max-w-sm">
          <p className="mb-3 text-sm text-muted-foreground">Enter the 6-digit code we emailed you.</p>
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
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Verify
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          <p className="mb-3 text-sm text-muted-foreground">
            Sign in with your email — no wallet apps, no seed phrases, no popups.
          </p>
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
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send code
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Wallet className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Set up your Basemate account</h1>
      {children}
    </section>
  );
}

function StatusBlock({
  icon,
  title,
  message,
}: {
  icon: "spin" | "ok" | "error";
  title?: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {icon === "spin" ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : icon === "ok" ? (
        <CheckCircle2 className="h-10 w-10 text-up" />
      ) : (
        <AlertCircle className="h-10 w-10 text-destructive" />
      )}
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
