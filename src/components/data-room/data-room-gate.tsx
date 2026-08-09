"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SiteShell } from "@/components/site/site-shell";

export function DataRoomGate({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/data-room/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, firm, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not unlock.");
        setPending(false);
        return;
      }
      const dest =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/data-room";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setPending(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-white shadow-sm"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Image
              src="/brand/logo/basemate-mark-transparent.png"
              alt="Basemate"
              width={40}
              height={40}
              className="rounded-xl"
            />
          </div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Mate · Seed data room
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Who are we talking to?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your name and the password you were given to unlock materials.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-[20px] border border-border bg-white p-5 shadow-sm"
        >
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your name
            </span>
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Partner"
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground/70 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Firm <span className="normal-case tracking-normal text-muted-foreground/70">(optional)</span>
            </span>
            <input
              autoComplete="organization"
              value={firm}
              onChange={(e) => setFirm(e.target.value)}
              placeholder="Spartan Group"
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground/70 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Password
            </span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground/70 focus:ring-2"
            />
          </label>

          {error && (
            <p className="text-sm text-down" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Unlocking…" : "Unlock data room"}
          </button>
        </form>
      </div>
    </SiteShell>
  );
}
