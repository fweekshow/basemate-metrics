import Image from "next/image";
import Link from "next/link";

const PHONE_DISPLAY = "+1 (628) 316-5638";
const PHONE_E164 = "+16283165638";
const SMS_HREF = `sms:${PHONE_E164}?body=${encodeURIComponent("hey")}`;

/**
 * Companion gate for anonymous visitors at /. Basemate lives in iMessage —
 * web is the account manager for people who already set up.
 */
export function ImessageGate() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(5,5,255,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/brand/mascot/mate-eyes-blue.png"
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 rounded-2xl shadow-[var(--shadow-card)]"
            priority
          />
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Basemate on iMessage
            </h1>
            <p className="mx-auto max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
              Send Money in your Texts
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <p className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {PHONE_DISPLAY}
          </p>
          <a
            href={SMS_HREF}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(5,5,255,0.25)] transition-all hover:brightness-110 hover:shadow-[0_4px_32px_rgba(5,5,255,0.4)] active:scale-[0.97]"
          >
            Open in Messages
          </a>
        </div>

        <div className="flex flex-col items-center gap-3 text-sm">
          <Link
            href="/app"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
          >
            Already set up? Sign in to web account
          </Link>
          <Link
            href="/landing"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            What is Basemate?
          </Link>
        </div>
      </div>
    </div>
  );
}
