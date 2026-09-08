"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Loader2, Rocket } from "lucide-react";

import { Panel, SectionLabel } from "@/components/dashboard/primitives";
import { ErrorBand, useIstonks } from "@/components/istonks/ui";
import {
  FEE_SPLIT,
  feeModeLabel,
  normalizeStock,
  readError,
  toArray,
  type IstonksStock,
} from "@/lib/istonks";

type FeeMode = "both" | "stock";
type Step = "form" | "confirm" | "done";

const INPUT =
  "w-full rounded-full border border-border bg-card px-4 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50";

async function downscaleToDataUrl(file: File, maxBytes = 900_000): Promise<string> {
  if (file.size <= maxBytes && file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, Math.sqrt(maxBytes / Math.max(file.size, 1)));
  const width = Math.max(64, Math.floor(bitmap.width * scale));
  const height = Math.max(64, Math.floor(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function LaunchClient() {
  const stocksFetch = useIstonks<unknown>("/api/istonks/stocks");
  const launchable = useMemo(
    () =>
      toArray(stocksFetch.data)
        .map(normalizeStock)
        .filter((s) => s.launchable && s.symbol)
        .sort((a, b) => (a.symbol ?? "").localeCompare(b.symbol ?? "")),
    [stocksFetch.data],
  );

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [pairSymbol, setPairSymbol] = useState("");
  const [feeMode, setFeeMode] = useState<FeeMode>("both");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundUrl, setFundUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    tokenAddress: string;
    tokenUrl: string;
    explorerUrl: string | null;
    pairSymbol: string;
    feeMode: string;
  } | null>(null);

  const selectedPair: IstonksStock | undefined = launchable.find((s) => s.symbol === pairSymbol);

  async function onPickImage(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await downscaleToDataUrl(file);
      setPreview(dataUrl);
      const res = await fetch("/api/app/istonks/launch/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readError(body) ?? `HTTP ${res.status}`);
      const url = typeof body?.imageUrl === "string" ? body.imageUrl : null;
      if (!url) throw new Error("Upload succeeded but no image URL came back.");
      setImageUrl(url);
    } catch (err) {
      setPreview(null);
      setImageUrl(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  function validateForm(): string | null {
    if (name.trim().length < 2 || name.trim().length > 50) return "Name must be 2–50 characters.";
    const ticker = symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (ticker.length < 2 || ticker.length > 10) return "Ticker must be 2–10 letters/numbers.";
    if (!pairSymbol) return "Pick a stock pair.";
    return null;
  }

  function goConfirm() {
    const err = validateForm();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep("confirm");
  }

  async function submitLaunch() {
    setSubmitting(true);
    setError(null);
    setFundUrl(null);
    try {
      const ticker = symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const res = await fetch("/api/app/istonks/launch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          symbol: ticker,
          pairSymbol,
          imageUrl: imageUrl ?? undefined,
          feeMode,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (typeof body?.fundUrl === "string") setFundUrl(body.fundUrl);
        throw new Error(readError(body) ?? `HTTP ${res.status}`);
      }
      setResult({
        tokenAddress: String(body.tokenAddress),
        tokenUrl: String(body.tokenUrl),
        explorerUrl: typeof body.explorerUrl === "string" ? body.explorerUrl : null,
        pairSymbol: String(body.pairSymbol ?? pairSymbol),
        feeMode: String(body.feeMode ?? feeMode),
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" && result) {
    return (
      <div className="animate-ticker-in space-y-4">
        <SectionLabel>launched</SectionLabel>
        <Panel title={`$${symbol.toUpperCase()} is live`} bodyClassName="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-up" />
            <div>
              <p className="font-display text-lg font-semibold">
                Paired with ${result.pairSymbol}
              </p>
              <p className="font-mono text-[12px] text-muted-foreground">
                fees: {feeModeLabel(result.feeMode)}
              </p>
            </div>
          </div>
          <p className="break-all font-mono text-[11px] text-muted-foreground">
            {result.tokenAddress}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/istonks/token/${result.tokenAddress}`}
              className="rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground"
            >
              Token page
            </Link>
            {result.explorerUrl ? (
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
              >
                Basescan
              </a>
            ) : null}
            <Link
              href="/istonks"
              className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              Board
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="animate-ticker-in mx-auto max-w-xl space-y-4">
      <div>
        <SectionLabel>launch</SectionLabel>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Pair a token with a stock
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Same flow as iMessage — you pick the stock and how launcher fees pay out. Gas is
          self-funded from your Basemate wallet.
        </p>
      </div>

      {error ? <ErrorBand message={error} /> : null}
      {fundUrl ? (
        <p className="text-[12px] text-muted-foreground">
          Need ETH?{" "}
          <Link href="/istonks/fund" className="text-primary hover:underline">
            Fund your wallet →
          </Link>
        </p>
      ) : null}

      {step === "form" ? (
        <Panel title="details" bodyClassName="space-y-4 p-5">
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Name
            </span>
            <input
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza Coin"
              maxLength={50}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Ticker
            </span>
            <input
              className={INPUT}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="PIZZA"
              maxLength={10}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Stock pair
            </span>
            <select
              className={INPUT}
              value={pairSymbol}
              onChange={(e) => setPairSymbol(e.target.value)}
              disabled={stocksFetch.loading}
            >
              <option value="">
                {stocksFetch.loading
                  ? "Loading…"
                  : launchable.length
                    ? "Pick a launchable stock"
                    : "No launchable stocks yet"}
              </option>
              {launchable.map((s) => (
                <option key={s.symbol!} value={s.symbol!}>
                  ${s.symbol} — {s.name ?? "stock"}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Fee payout
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    id: "both" as const,
                    title: "Token + stock",
                    body: "Your 75% share pays out in both the meme token and the paired stock.",
                  },
                  {
                    id: "stock" as const,
                    title: "Stock only",
                    body: `Meme fees auto-convert into ${selectedPair?.symbol ?? "the stock"}. You only claim the stock.`,
                  },
                ] as const
              ).map((opt) => {
                const active = feeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFeeMode(opt.id)}
                    className={`rounded-[20px] border px-4 py-3 text-left transition-colors ${
                      active
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                      {opt.title}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      {opt.body}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Image (optional)
            </span>
            <label className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-dashed border-border bg-card px-4 py-3 hover:border-primary/40">
              {preview ? (
                <Image
                  src={preview}
                  alt="Token preview"
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-xl object-cover"
                />
              ) : (
                <ImagePlus className="size-8 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px]">
                  {uploading ? "Uploading…" : imageUrl ? "Image ready" : "Add a photo"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  PNG/JPG up to ~1MB after compress
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={goConfirm}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-40"
          >
            Review launch
          </button>
        </Panel>
      ) : (
        <Panel title="confirm" bodyClassName="space-y-4 p-5">
          <dl className="space-y-2 font-mono text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{name.trim()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ticker</dt>
              <dd>${symbol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pair</dt>
              <dd>${pairSymbol}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Fees</dt>
              <dd>{feeModeLabel(feeMode)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Image</dt>
              <dd>{imageUrl ? "yes" : "none"}</dd>
            </div>
          </dl>

          <div className="rounded-[16px] border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Split locked at launch:{" "}
            {FEE_SPLIT.map((s) => `${s.percent}% ${s.label}`).join(" · ")}. You pay Base gas from
            your Basemate wallet.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep("form")}
              className="rounded-full border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitLaunch()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-40"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
              {submitting ? "Launching…" : "Launch"}
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}
