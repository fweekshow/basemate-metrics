import type { Metadata } from "next";
import Image from "next/image";

import { SkillCopy } from "@/app/skills/send-stock/skill-copy";
import { SiteShell } from "@/components/site/site-shell";
import { SEND_STOCK_API_URL, SEND_STOCK_SKILL } from "@/lib/skills/send-stock";

export const metadata: Metadata = {
  title: "Send stock · Muse skill",
  description: "Paste this skill into Muse. No API key. Send tokenized stocks through Basemate.",
};

export default function SendStockSkillPage() {
  return (
    <SiteShell hideFooter>
      <section className="relative mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-32 pt-8 sm:px-6 sm:pt-12">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[20px] bg-white p-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Image
              src="/brand/muse/muse-portrait.png"
              alt="Muse"
              width={320}
              height={320}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <p className="mt-5 font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
            MUSE SKILL
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Send stock from Muse
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted-foreground">
            Paste this into Muse. No API key. Money only moves when you Apple Pay.
          </p>
        </div>

        <SkillCopy skill={SEND_STOCK_SKILL} apiUrl={SEND_STOCK_API_URL} />
      </section>
    </SiteShell>
  );
}
