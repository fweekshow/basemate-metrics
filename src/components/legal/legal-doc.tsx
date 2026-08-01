import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { SITE } from "@/lib/site";

export function LegalDoc({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 space-y-3 border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Legal
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </header>
        <div className="legal-prose space-y-6 text-[15px] leading-relaxed text-foreground">
          {children}
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Questions?{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {SITE.supportEmail}
          </a>
          {" · "}
          <Link href="/waitlist" className="text-primary underline-offset-4 hover:underline">
            Waitlist
          </Link>
        </p>
      </article>
    </SiteShell>
  );
}

export function LegalSection({
  heading,
  children,
}: Readonly<{ heading: string; children: React.ReactNode }>) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-tight">{heading}</h2>
      <div className="space-y-3 text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:underline [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
