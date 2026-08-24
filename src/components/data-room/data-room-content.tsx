import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
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

function SectionHeading({
  eyebrow,
  title,
  blurb,
  action,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <Mono className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </Mono>
        <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {blurb && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {blurb}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Node / partner status pill — LIVE, CLOSING, IN TALKS, SEARCHING. */
function StatusPill({ status }: { status: string }) {
  const tone = status.startsWith("LIVE")
    ? "border-green-200 bg-green-50 text-green-700"
    : status.startsWith("CLOSING") || status.startsWith("LAUNCHING")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status.startsWith("IN TALKS")
        ? "border-primary/25 bg-primary/10 text-primary"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap ${tone}`}
    >
      {status}
    </span>
  );
}

export function DataRoomContent({
  investorView,
}: {
  investorView: DataRoomInvestorView;
}) {
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
              Open pre-seed deck
            </Link>
          </div>
        </div>

        {/* The gap */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="The gap"
            title="Messaging is the world's largest unbanked network."
            blurb="Billions already talk in Messages, with no way to send money without leaving the app. Stablecoins made the money itself instant and nearly free, and Base already hosts 25+ local-currency coins. The rail is finished. The front door isn't."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {INVESTOR.gap.map((stat) => (
              <div
                key={stat.value}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                  <Mono>{stat.value}</Mono>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
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
          <SectionHeading
            eyebrow="Materials"
            title="Deck, one-pager and the latest update"
            blurb="View in-browser or download the PDF."
          />
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

        {/* The product */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="The product"
            title="A local number. A global account."
            blurb="The number is local so funding, cash-out and support work in your market. The account behind it is global — one thread that reaches any phone number in the world. The app comes later, for advanced sends; the thread is enough to start."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {INVESTOR.product.map((step) => (
              <div
                key={step.step}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {step.step}
                </Mono>
                <h3 className="mt-1.5 font-display text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The network */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="The network"
            title="Each country is a node. We are the wire between them."
            blurb="Every country is licensing its own stablecoin, and each one is an island. We own the messaging, the local issuer owns the currency, and together that is one network."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {INVESTOR.networkLayers.map((layer) => (
              <div
                key={layer.title}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {layer.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {layer.body}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-[20px] border border-border bg-white p-5 shadow-sm">
            <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Reach · already installed
            </Mono>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { title: "iMessage", note: "Live · via Photon" },
                { title: "WhatsApp", note: "Live today · more platforms to come" },
                {
                  title: "Any number on earth",
                  note: "The recipient installs nothing. A text arrives with the money in it.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The deal */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="The deal"
            title="We own the chat. You own the currency."
            blurb="We don't issue, we don't hold licences and we never hold customer funds. We take no side between currencies. Inside a market we commit to one partner, so they get every user on that number, and the issuer decides when funds release."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {INVESTOR.deal.map((point) => (
              <div
                key={point.title}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <h3 className="font-display text-base font-semibold text-foreground">
                  {point.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Country nodes */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Corridors"
            title="One network. APAC first."
            blurb="The first corridor is Singapore ⇄ Indonesia, one of the two largest in the region, with money moving both ways. Five markets is the minimum Photon needs to provision international numbers, and APAC is where the local stablecoins, the ramps and the remittance volume already are."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-border bg-white p-5 shadow-sm">
              <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Node partners signed
              </Mono>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                {investorView.loisSigned} / {investorView.loisTarget}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Target: {investorView.loisTarget} markets this raise
              </p>
              {investorView.loisPending > 0 && (
                <p className="mt-0.5 text-xs font-medium text-blue-500">
                  {investorView.loisPending} pending
                </p>
              )}
            </div>
            {[
              {
                label: "Live on Base",
                value: "25+",
                note: "Local-currency stablecoins",
              },
              {
                label: "Corridor volume",
                value: "$857B",
                note: "Sent across borders every year",
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTOR.nodes.map((node) => (
              <div
                key={node.country}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-semibold text-foreground">
                      <span className="mr-2 text-lg">{node.flag}</span>
                      {node.country}
                    </p>
                    <Mono className="mt-1 block text-xs font-bold text-primary">
                      {node.ticker}
                    </Mono>
                  </div>
                  <StatusPill status={node.status} />
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {node.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Business model */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Business model"
            title="The swap and the float."
            blurb={INVESTOR.businessModel.note}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {INVESTOR.businessModel.lines.map((line) => (
              <div
                key={line.label}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {line.label}
                </Mono>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                  {line.value}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {line.body}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-[20px] border border-border bg-white p-5 shadow-sm">
            <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {INVESTOR.businessModel.example.label}
            </Mono>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {INVESTOR.businessModel.example.rows.map((row) => (
                <div key={row.label}>
                  <p className="text-sm font-medium text-foreground">
                    {row.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                    <Mono>{row.value}</Mono>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Partners"
            title="Every layer is best in class."
            blurb="Photon for the numbers, Definitive for the swaps, Base for settlement, and one licensed issuer per country for local money. They bring the licence, the banks and the mint. We bring the users and the chat, plus the part nobody else has: the account layer and the network between the nodes."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTOR.partners.map((partner) => (
              <div
                key={partner.name}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {partner.name}
                  </h3>
                  <StatusPill status={partner.status} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {partner.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Stablecoin directory */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Reference"
            title="Local stablecoins on Base"
            blurb="25+ local-currency stablecoins are live on Base. Each one is a market where a Stablemate number can land — APAC is where we start."
            action={
              <a
                href="/stablecoin-directory.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center rounded-full border border-border bg-white px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Full directory ↗
              </a>
            }
          />

          <div className="overflow-hidden rounded-[20px] border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Country", "Ticker", "Issuer", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { flag: "🇸🇬", country: "Singapore",     currency: "SGD", ticker: "XSGD",  issuer: "StraitsX",      status: "BASE ✓",    live: true  },
                    { flag: "🇮🇩", country: "Indonesia",     currency: "IDR", ticker: "IDRX",  issuer: "IDRX",          status: "BASE ✓",    live: true  },
                    { flag: "🇲🇾", country: "Malaysia",      currency: "MYR", ticker: "MYRC",  issuer: "BLOX Malaysia", status: "BASE ✓",    live: true  },
                    { flag: "🇲🇽", country: "Mexico",        currency: "MXN", ticker: "MXNB",  issuer: "Bitso",         status: "BASE ✓",    live: true  },
                    { flag: "🇧🇷", country: "Brazil",        currency: "BRL", ticker: "BRZ",   issuer: "Transfero",     status: "BASE ✓",    live: true  },
                    { flag: "🇿🇦", country: "South Africa",  currency: "ZAR", ticker: "ZARP",  issuer: "Stablecoin ZA", status: "BASE ✓",    live: true  },
                    { flag: "🇦🇺", country: "Australia",     currency: "AUD", ticker: "AUDD",  issuer: "Novatti",       status: "BASE ✓",    live: true  },
                    { flag: "🇬🇧", country: "UK",            currency: "GBP", ticker: "TGBP",  issuer: "TBV (on Base)", status: "BASE ✓",    live: true  },
                    { flag: "🇨🇭", country: "Switzerland",   currency: "CHF", ticker: "VCHF",  issuer: "AllUnity",      status: "BASE ✓",    live: true  },
                    { flag: "🇸🇪", country: "Sweden",        currency: "SEK", ticker: "SEKAU", issuer: "AllUnity",      status: "BASE ✓",    live: true  },
                    { flag: "🇳🇬", country: "Nigeria",       currency: "NGN", ticker: "CNGN",  issuer: "WrappedCBDC",   status: "LAUNCHING", live: true  },
                    { flag: "🇯🇵", country: "Japan",         currency: "JPY", ticker: "JPYC",  issuer: "JPYC Inc.",     status: "TARGET",    live: false },
                    { flag: "🇵🇭", country: "Philippines",   currency: "PHP", ticker: "PHPC",  issuer: "Coins.ph",      status: "TARGET",    live: false },
                    { flag: "🇰🇪", country: "Kenya",         currency: "KES", ticker: "cKES",  issuer: "Mento Labs",    status: "TARGET",    live: false },
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
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {row.issuer}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                            row.status === "BASE ✓"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : row.status === "LAUNCHING"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
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
                Dimmed rows are not yet on Base. Full rows are confirmed live.
              </p>
              <a
                href="/stablecoin-directory.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline"
              >
                Full directory ↗
              </a>
            </div>
          </div>
        </section>

        {/* The ask */}
        <section className="rounded-[20px] border border-border bg-white p-6 shadow-sm sm:p-8">
          <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            The ask · {INVESTOR.milestone.label}
          </Mono>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            {investorView.target} pre-seed to bring the first node online
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Singapore ⇄ Indonesia, money moving both ways on a licensed rail,
            plus the partnerships signed for the nodes after it.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {INVESTOR.milestone.items.map((item) => (
              <div key={item.label}>
                <p className="font-display text-3xl font-bold text-primary">
                  {item.value}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <Mono className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Use of funds
            </Mono>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INVESTOR.useOfFunds.map((item) => (
                <div key={item.title}>
                  <p className="font-display text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we need */}
        <section className="space-y-4">
          <SectionHeading
            eyebrow="Beyond capital"
            title="What we need"
            blurb="The intros and conviction that close the first corridor."
          />
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
          <SectionHeading
            eyebrow="The team"
            title="Built by people who live in the chat."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {INVESTOR.team.map((person) => (
              <div
                key={person.name}
                className="rounded-[20px] border border-border bg-white p-5 shadow-sm"
              >
                <p className="font-display text-base font-semibold text-foreground">
                  {person.name}
                </p>
                <Mono className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {person.role}
                </Mono>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {person.bio}
                </p>
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
              href={`mailto:${INVESTOR.contactEmail}?subject=Stablemate%20Pre-Seed%20-%20Data%20Room`}
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
