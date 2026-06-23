import type { Metadata } from "next";

import { SiteShell } from "@/components/site/site-shell";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Waitlist · Basemate",
  description:
    "Trade, earn, and launch on Base right inside your messages. Join the waitlist for Basemate on iMessage.",
  openGraph: {
    title: "Waitlist · Basemate",
    description:
      "Join the waitlist for Basemate on iMessage.",
    type: "website",
    images: [SITE.pfp],
  },
};

export default function WaitlistPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              coming soon · iMessage
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Trade on Base, right in your{" "}
              <span className="text-primary">messages.</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Basemate is coming to iMessage. Long ETH, swap tokens, earn yield,
              and scout launches — all by texting. Join the waitlist and we&apos;ll
              send your invite the moment it&apos;s live.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "One message to trade — no app switching",
                "Be first in line when invites roll out",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-up/10 text-up">
                    <svg
                      viewBox="0 0 20 20"
                      className="size-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        d="M5 10l3.5 3.5L15 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <WaitlistForm />
        </div>
      </section>
    </SiteShell>
  );
}
