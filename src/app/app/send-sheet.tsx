"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

import { BubbleMarkTile } from "@/app/app/app-brand-tiles";

export type SendPrefill = {
  name?: string;
  phone?: string;
  amount?: string;
  memo?: string;
};

type Phase = "compose" | "confirm" | "success";

type ResolveDelivery = "instant" | "claim";

function newSendId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function SendSheet({
  open,
  onClose,
  prefill,
  onSuccess,
  onNeedDeposit,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: SendPrefill | null;
  onSuccess: () => void;
  onNeedDeposit: (amount: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("compose");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [delivery, setDelivery] = useState<ResolveDelivery | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState<string | null>(null);
  const [sendId] = useState(() => newSendId());
  const [successLine, setSuccessLine] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhase("compose");
    setError(null);
    setConfirmToken(null);
    setName(prefill?.name ?? "");
    setPhone(prefill?.phone ?? "");
    setAmount(prefill?.amount ?? "");
    setMemo(prefill?.memo ?? "");
    setDelivery(null);
  }, [open, prefill]);

  const numericAmount = Number(amount);
  const canContinue =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    Number.isFinite(numericAmount) &&
    numericAmount >= 1;

  const resolvePhone = useCallback(async () => {
    const q = new URLSearchParams({ phone: phone.trim() });
    const res = await fetch(`/api/app/send/resolve?${q.toString()}`, { cache: "no-store" });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error ?? "Could not resolve recipient.");
    setDelivery(body.delivery as ResolveDelivery);
    return body.delivery as ResolveDelivery;
  }, [phone]);

  useEffect(() => {
    if (!open || phone.trim().length < 8) {
      setDelivery(null);
      return;
    }
    const t = setTimeout(() => {
      void resolvePhone().catch(() => setDelivery(null));
    }, 400);
    return () => clearTimeout(t);
  }, [open, phone, resolvePhone]);

  async function continueToConfirm() {
    if (!canContinue || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/app/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sendId,
          name: name.trim(),
          phone: phone.trim(),
          amount: String(numericAmount),
          asset: "USDC",
          memo: memo.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.depositAmount) onNeedDeposit(String(body.depositAmount));
        throw new Error(body?.error ?? "Could not start send.");
      }
      setConfirmToken(body.confirmToken as string);
      setDelivery((body.delivery as ResolveDelivery) ?? delivery);
      setPhase("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start send.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSend() {
    if (!confirmToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: confirmToken }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Confirmation failed.");
      const d = delivery ?? "claim";
      setSuccessLine(
        d === "instant"
          ? `Sent $${numericAmount} USDC to ${name.trim()}.`
          : `Sent $${numericAmount} USDC to ${name.trim()}. Waiting to be claimed.`,
      );
      setPhase("success");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed.");
    } finally {
      setBusy(false);
    }
  }

  const deliveryHint = useMemo(() => {
    if (delivery === "instant") return "They'll receive it instantly.";
    if (delivery === "claim") return "They'll get a text to claim their USDC.";
    return null;
  }, [delivery]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-xl)] border border-border/60 bg-card p-6 shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold">
            {phase === "confirm" ? "Confirm send" : phase === "success" ? "Sent" : "Send USDC"}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {phase === "compose" && (
          <>
            <p className="mt-1 text-xs text-muted-foreground">
              Chat can auto-send under your limit — change that in Agent Settings.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (+1…)"
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 font-mono text-sm outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(String(n))}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                  >
                    ${n}
                  </button>
                ))}
              </div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (USDC)"
                inputMode="decimal"
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 font-mono text-sm outline-none"
              />
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Memo (optional)"
                maxLength={140}
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none"
              />
              {deliveryHint && (
                <p className="text-xs font-medium text-muted-foreground">{deliveryHint}</p>
              )}
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" disabled className="rounded" />
                Make this monthly (coming soon)
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <button
              type="button"
              disabled={!canContinue || busy}
              onClick={() => void continueToConfirm()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </button>
          </>
        )}

        {phase === "confirm" && (
          <>
            <div className="mt-4 space-y-2 rounded-2xl bg-accent/80 px-4 py-3 text-sm">
              <p>
                <span className="text-muted-foreground">To</span>{" "}
                <span className="font-semibold">{name.trim()}</span>
                <span className="font-mono text-xs text-muted-foreground"> · {phone.trim()}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Amount</span>{" "}
                <span className="font-mono font-semibold tabular-nums">
                  ${numericAmount} USDC
                </span>
              </p>
              {memo.trim() && (
                <p>
                  <span className="text-muted-foreground">Memo</span> {memo.trim()}
                </p>
              )}
              {deliveryHint && <p className="text-xs text-muted-foreground">{deliveryHint}</p>}
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmSend()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm send"}
            </button>
          </>
        )}

        {phase === "success" && (
          <>
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <BubbleMarkTile size={72} animate />
              <p className="text-sm leading-relaxed">{successLine}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
