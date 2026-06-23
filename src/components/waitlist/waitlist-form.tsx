"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Common dial codes — flag, ISO label, and E.164 prefix. US first as default. */
const COUNTRY_CODES = [
  { iso: "US", flag: "🇺🇸", name: "United States", dial: "+1" },
  { iso: "CA", flag: "🇨🇦", name: "Canada", dial: "+1" },
  { iso: "GB", flag: "🇬🇧", name: "United Kingdom", dial: "+44" },
  { iso: "IN", flag: "🇮🇳", name: "India", dial: "+91" },
  { iso: "AU", flag: "🇦🇺", name: "Australia", dial: "+61" },
  { iso: "DE", flag: "🇩🇪", name: "Germany", dial: "+49" },
  { iso: "FR", flag: "🇫🇷", name: "France", dial: "+33" },
  { iso: "ES", flag: "🇪🇸", name: "Spain", dial: "+34" },
  { iso: "IT", flag: "🇮🇹", name: "Italy", dial: "+39" },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands", dial: "+31" },
  { iso: "PT", flag: "🇵🇹", name: "Portugal", dial: "+351" },
  { iso: "IE", flag: "🇮🇪", name: "Ireland", dial: "+353" },
  { iso: "BR", flag: "🇧🇷", name: "Brazil", dial: "+55" },
  { iso: "MX", flag: "🇲🇽", name: "Mexico", dial: "+52" },
  { iso: "AR", flag: "🇦🇷", name: "Argentina", dial: "+54" },
  { iso: "JP", flag: "🇯🇵", name: "Japan", dial: "+81" },
  { iso: "KR", flag: "🇰🇷", name: "South Korea", dial: "+82" },
  { iso: "CN", flag: "🇨🇳", name: "China", dial: "+86" },
  { iso: "SG", flag: "🇸🇬", name: "Singapore", dial: "+65" },
  { iso: "HK", flag: "🇭🇰", name: "Hong Kong", dial: "+852" },
  { iso: "AE", flag: "🇦🇪", name: "United Arab Emirates", dial: "+971" },
  { iso: "SA", flag: "🇸🇦", name: "Saudi Arabia", dial: "+966" },
  { iso: "ZA", flag: "🇿🇦", name: "South Africa", dial: "+27" },
  { iso: "NG", flag: "🇳🇬", name: "Nigeria", dial: "+234" },
  { iso: "KE", flag: "🇰🇪", name: "Kenya", dial: "+254" },
  { iso: "PH", flag: "🇵🇭", name: "Philippines", dial: "+63" },
  { iso: "ID", flag: "🇮🇩", name: "Indonesia", dial: "+62" },
  { iso: "PK", flag: "🇵🇰", name: "Pakistan", dial: "+92" },
  { iso: "BD", flag: "🇧🇩", name: "Bangladesh", dial: "+880" },
  { iso: "TR", flag: "🇹🇷", name: "Turkey", dial: "+90" },
  { iso: "SE", flag: "🇸🇪", name: "Sweden", dial: "+46" },
  { iso: "NO", flag: "🇳🇴", name: "Norway", dial: "+47" },
  { iso: "PL", flag: "🇵🇱", name: "Poland", dial: "+48" },
  { iso: "NZ", flag: "🇳🇿", name: "New Zealand", dial: "+64" },
] as const;

const PLATFORMS = [
  { id: "ios", label: "iPhone / iOS" },
  { id: "android", label: "Android" },
] as const;

type Platform = (typeof PLATFORMS)[number]["id"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/40";

const labelClass = "block text-sm font-medium text-foreground";

type Status = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [fullName, setFullName] = useState("");
  const [countryIso, setCountryIso] = useState<string>(COUNTRY_CODES[0].iso);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<Platform>("ios");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const country =
    COUNTRY_CODES.find((c) => c.iso === countryIso) ?? COUNTRY_CODES[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = fullName.trim();
    const digits = mobile.replace(/[^\d]/g, "");
    const mail = email.trim();

    if (!name) return setError("Please enter your full name.");
    if (digits.length < 6) return setError("Please enter a valid mobile number.");
    if (!EMAIL_RE.test(mail)) return setError("Please enter a valid email address.");

    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          countryCode: country.dial,
          countryIso: country.iso,
          mobile: digits,
          phone: `${country.dial}${digits}`,
          email: mail,
          platform,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Something went wrong (${res.status}).`);
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="rounded-2xl bg-primary p-4 shadow-[0_0_40px_rgba(5,5,255,0.35),0_0_0_1px_rgba(5,5,255,0.3)]">
          <Image
            src="/brand/logo/basemate-mark-transparent.png"
            alt=""
            width={96}
            height={96}
            className="select-none"
            draggable={false}
          />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold">You&apos;re on the list</h2>
          <p className="mx-auto max-w-sm text-muted-foreground">
            We&apos;ll text {country.dial} {mobile} the moment Basemate lands in
            your messages. No spam — just your invite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8 lg:p-9"
    >
      <div className="space-y-2">
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Satoshi Nakamoto"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="mobile" className={labelClass}>
          Mobile number
        </label>
        <div className="flex gap-2">
          <div className="relative shrink-0">
            <select
              aria-label="Country code"
              value={countryIso}
              onChange={(e) => setCountryIso(e.target.value)}
              className={`${inputClass} h-12 w-[7.5rem] appearance-none pr-9 font-mono`}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.flag} {c.dial}
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="555 123 4567"
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <span className={labelClass}>Your phone</span>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => {
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                aria-pressed={active}
                className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-accent text-primary"
                    : "border-border bg-white text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={status === "submitting"}
        className="h-12 w-full rounded-full text-[15px] font-semibold"
      >
        {status === "submitting" ? "Joining…" : "Join the waitlist"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Works on iPhone and Android. We&apos;ll only message you about your Basemate
        invite.
      </p>
    </form>
  );
}
