import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import {
  formatStage,
  type TalkingToContact,
} from "@/lib/data-room-db";
import type { DataRoomInvestorView } from "@/lib/data-room-content";
import { INVESTOR } from "@/lib/investor";

function Mono({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono tabular-nums tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function formatMeeting(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export function DataRoomContent({
  visitorName,
  visitorFirm,
  talkingTo,
  investorView,
}: {
  visitorName: string;
  visitorFirm: string;
  talkingTo: TalkingToContact[];
  investorView: DataRoomInvestorView;
}) {
  const visitorLabel = visitorFirm
    ? `${visitorName} · ${visitorFirm}`
    : visitorName;

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 space-y-14">
        {/* Header */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Mono className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Investor data room · {investorView.round} {investorView.year}
            </Mono>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
              Actively closing
            </span>
          </div>
          <h1
            className="max-w-2xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            {investorView.headline}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {investorView.subhead}
          </p>
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{visitorLabel}</span>
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={`mailto:${INVESTOR.contactEmail}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Email {INVESTOR.contactEmail}
            </a>
            <Link
              href="/deck"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open seed deck
            </Link>
          </div>
        </div>

        {/* Who we're talking to */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Who we&apos;re talking to
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Live from Notion → sync. Add firms in{" "}
              <span className="font-medium text-foreground">VC pipeline</span>, check{" "}
              <span className="font-medium text-foreground">Show on site</span>, then sync.
              Optional: Mate{" "}
              <Mono className="text-xs text-foreground">/vc stage &lt;firm&gt; &lt;stage&gt;</Mono> when
              pipeline DB is empty.
            </p>
          </div>
          {talkingTo.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-border bg-white/70 p-6 text-sm text-muted-foreground">
              No active conversations yet. When you move a firm to outreach,
              meeting, follow-up, or term sheet via text, they show up here.
            </div>
          ) : (
            <div className="grid gap-3">
              {talkingTo.map((contact) => {
                const meeting = formatMeeting(contact.meetingDate);
                const noteLine = contact.notes?.split("\n")[0]?.trim();
                return (
                  <div
                    key={`${contact.firm}-${contact.name}-${contact.stage}`}
                    className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {contact.firm}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {contact.name}
                        </p>
                      </div>
                      <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {formatStage(contact.stage)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {meeting && (
                        <span>
                          Meeting{" "}
                          <Mono className="text-foreground">{meeting}</Mono>
                        </span>
                      )}
                      {contact.tier && (
                        <span>
                          <Mono className="text-foreground">{contact.tier}</Mono>
                        </span>
                      )}
                    </div>
                    {noteLine && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {noteLine}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Raise strip — stages: target → pending → committed */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Target",
              value: investorView.target,
              note: investorView.targetNote,
            },
            {
              label: "Pending",
              value: investorView.pending,
              note: investorView.pendingNote,
            },
            {
              label: "Committed",
              value: investorView.committed,
              note: investorView.committedNote,
            },
            {
              label: "Status",
              value: "Pre-seed",
              note: investorView.status,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
            >
              <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </Mono>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">{stat.note}</p>
            </div>
          ))}
        </section>

        {/* Documents */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Materials
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Flagship deck plus supporting pack. View in-browser or download PDF.
            </p>
          </div>
          <div className="grid gap-3">
            {INVESTOR.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-4 rounded-[20px] border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10">
                    <Image
                      src="/brand/logo/basemate-mark-transparent.png"
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {doc.toolbarLabel}
                      </h3>
                      <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {doc.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {doc.blurb}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pl-4">
                  <Link
                    href={doc.path}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary px-5 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:flex-none"
                  >
                    View
                  </Link>
                  <a
                    href={doc.pdfUrl}
                    download={doc.downloadName}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border bg-white px-5 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:flex-none"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Traction */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Traction
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                US node live on iMessage and RCS. Numbers from the August update.
              </p>
            </div>
            <a
              href={INVESTOR.metricsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full border border-border bg-white px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Live metrics ↗
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {investorView.traction.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] border border-border bg-white p-4 shadow-sm"
              >
                <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                  <Mono>{stat.value}</Mono>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stablecoin corridors */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Stablecoin corridors
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every country gets a Mate number. 20+ local-currency stablecoins are live on Base.
                Target: 10 LOI signatures this raise.
              </p>
            </div>
            <a
              href="/stablecoin-directory.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full border border-border bg-white px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Full directory ↗
            </a>
          </div>

          {/* LOI stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "LOIs Signed", value: "0 / 10", note: "Target: 10 this raise" },
              { label: "Confirmed on Base", value: "20+", note: "Local-currency stablecoins live" },
              { label: "Corridor Volume", value: "$800B", note: "Global remittance / yr" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[20px] border border-border bg-white p-5 shadow-sm">
                <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {stat.label}
                </Mono>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{stat.note}</p>
              </div>
            ))}
          </div>

          {/* Corridor table */}
          <div className="overflow-hidden rounded-[20px] border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Country", "Ticker", "Issuer", "Contact", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { flag: "🇲🇽", country: "Mexico",       currency: "MXN", ticker: "MXNB",  issuer: "Bitso",          contact: "@bitso",          status: "BASE ✓",   live: true  },
                    { flag: "🇧🇷", country: "Brazil",        currency: "BRL", ticker: "BRZ",   issuer: "Transfero",      contact: "@Transfero_Group",status: "BASE ✓",   live: true  },
                    { flag: "🇿🇦", country: "South Africa",  currency: "ZAR", ticker: "ZARP",  issuer: "Stablecoin ZA",  contact: "@simondingle",    status: "BASE ✓",   live: true  },
                    { flag: "🇳🇬", country: "Nigeria",       currency: "NGN", ticker: "CNGN",  issuer: "WrappedCBDC",   contact: "@WrappedCBDC",    status: "LAUNCHING",live: true  },
                    { flag: "🇸🇬", country: "Singapore",     currency: "SGD", ticker: "XSGD",  issuer: "StraitsX",       contact: "@StraitsX",       status: "BASE ✓",   live: true  },
                    { flag: "🇮🇩", country: "Indonesia",     currency: "IDR", ticker: "IDRX",  issuer: "IDRX",           contact: "@idrx_co",        status: "BASE ✓",   live: true  },
                    { flag: "🇲🇾", country: "Malaysia",      currency: "MYR", ticker: "MYRC",  issuer: "BLOX",           contact: "@BLOX_digital",   status: "BASE ✓",   live: true  },
                    { flag: "🇦🇺", country: "Australia",     currency: "AUD", ticker: "AUDD",  issuer: "Novatti",        contact: "@NovattiBiz",     status: "BASE ✓",   live: true  },
                    { flag: "🇬🇧", country: "UK",            currency: "GBP", ticker: "TGBP",  issuer: "TBV (on Base)",  contact: "—",               status: "BASE ✓",   live: true  },
                    { flag: "🇨🇭", country: "Switzerland",   currency: "CHF", ticker: "VCHF",  issuer: "AllUnity",       contact: "@AllUnity_io",    status: "BASE ✓",   live: true  },
                    { flag: "🇸🇪", country: "Sweden",        currency: "SEK", ticker: "SEKAU", issuer: "AllUnity",       contact: "@AllUnity_io",    status: "BASE ✓",   live: true  },
                    { flag: "🇵🇭", country: "Philippines",   currency: "PHP", ticker: "PHPC",  issuer: "Coins.ph",       contact: "@coinsPH",        status: "LOBBY",    live: false },
                    { flag: "🇯🇵", country: "Japan",         currency: "JPY", ticker: "JPYC",  issuer: "JPYC Inc.",      contact: "@JPYC_Inc",       status: "LOBBY",    live: false },
                    { flag: "🇰🇪", country: "Kenya",         currency: "KES", ticker: "cKES",  issuer: "Mento Labs",     contact: "@MentoLabs",      status: "LOBBY",    live: false },
                  ].map((row) => (
                    <tr key={`${row.country}-${row.ticker}`} className={row.live ? "" : "opacity-45"}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="mr-2 text-base">{row.flag}</span>
                        <span className="font-medium text-foreground">{row.country}</span>
                        <Mono className="ml-2 text-[10px] text-muted-foreground">{row.currency}</Mono>
                      </td>
                      <td className="px-4 py-3">
                        <Mono className="text-sm font-bold text-foreground">{row.ticker}</Mono>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{row.issuer}</td>
                      <td className="px-4 py-3">
                        <Mono className="text-xs text-primary">{row.contact}</Mono>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                          row.status === "BASE ✓"   ? "border-green-200  bg-green-50  text-green-700"  :
                          row.status === "LAUNCHING" ? "border-amber-200  bg-amber-50  text-amber-700"  :
                                                       "border-border     bg-muted     text-muted-foreground"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted-foreground">
                Dimmed rows = lobby targets. Full rows confirmed on Base.
              </p>
              <a
                href="/stablecoin-directory.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline"
              >
                Full directory with founder contacts ↗
              </a>
            </div>
          </div>
        </section>

        {/* Milestone */}
        <section className="rounded-[20px] border border-border bg-white p-6 shadow-sm sm:p-8">
          <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Use of proceeds · {INVESTOR.milestone.label}
          </Mono>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            $1M seed to light up the first five nodes
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {INVESTOR.milestone.items.map((item) => (
              <div key={item.label}>
                <p className="font-display text-4xl font-bold text-primary">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we need */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              What we need
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Beyond capital — the intros and conviction that close the next milestone.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {INVESTOR.needs.map((need) => (
              <div
                key={need.title}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {need.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {need.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold tracking-tight">Team</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INVESTOR.team.map((person) => (
              <div
                key={person.name}
                className="rounded-[20px] border border-border bg-white p-4 shadow-sm"
              >
                <p className="font-display text-sm font-semibold text-foreground">
                  {person.name}
                </p>
                <Mono className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {person.role}
                </Mono>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-[20px] border border-primary/20 bg-primary/[0.04] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Let&apos;s talk
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            First cheque is pending close. Reach out if you want the full
            picture or a warm intro path into the raise.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`mailto:${INVESTOR.contactEmail}?subject=Mate%20Seed%20-%20Data%20Room`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {INVESTOR.contactEmail}
            </a>
            <Link
              href="/deck"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              View deck
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
