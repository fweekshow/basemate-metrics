import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

const nav = [
  { href: "/", label: "Home", external: false },
  { href: "/brand", label: "Brand", external: false },
  { href: "/waitlist", label: "Waitlist", external: false },
  { href: "/pay", label: "Pay", external: false },
  { href: SITE.metricsUrl, label: "Metrics", external: true },
] as const;

export function SiteShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-full flex flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{ background: "radial-gradient(ellipse at top, rgba(5,5,255,0.05) 0%, transparent 65%)" }}
      />

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/brand/logo/basemate-logo-flat.png"
              alt="@basemate"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="truncate font-mono text-sm font-semibold tracking-tight">
              {SITE.name}
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {nav.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            {SITE.name} · {SITE.tagline}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a
              href={SITE.baseAppStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 hover:text-foreground transition-colors"
            >
              Download Base App
            </a>
            <Link href="/brand" className="py-2 hover:text-foreground transition-colors">
              Brand
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SiteCtaRow() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button
        render={<a href={SITE.profileUrl} target="_blank" rel="noopener noreferrer" />}
        nativeButton={false}
        size="lg"
        className="w-full sm:w-auto min-h-[44px]"
      >
        Add @basemate to your group
      </Button>
      <Button
        render={<a href={SITE.appUrl} target="_blank" rel="noopener noreferrer" />}
        nativeButton={false}
        variant="outline"
        size="lg"
        className="w-full sm:w-auto min-h-[44px]"
      >
        Open app.basemate.app
      </Button>
    </div>
  );
}
