"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Coins,
  Home,
  LineChart,
  Menu,
  MessageCircle,
  Percent,
  Rocket,
  Settings,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { RegSFooter } from "@/components/istonks/reg-s-footer";
import { useSession } from "@/components/shell/session-provider";
import { cn } from "@/lib/utils";
import {
  flattenNavItems,
  MOBILE_TAB_HREFS,
  NAV_GROUPS,
  navItemActive,
  type NavIcon,
  type NavItem,
} from "@/lib/nav-config";
import { IMESSAGE_HREF, SITE } from "@/lib/site";

const ICONS: Record<NavIcon, typeof Home> = {
  home: Home,
  account: Wallet,
  earn: Percent,
  activity: Activity,
  contacts: Users,
  istonks: TrendingUp,
  launch: Rocket,
  fees: Coins,
  launches: Rocket,
  stocks: LineChart,
  metrics: LineChart,
  stablecoins: Coins,
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function shortAddress(address: string | null): string {
  if (!address || address.length < 10) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const active = navItemActive(item.href, pathname, item.exact);
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-full px-3 text-[14px] transition-colors",
        focusRing,
        collapsed && "justify-center px-0",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span>{item.label}</span> : null}
    </Link>
  );
}

export function ProductShell({
  children,
  regs = false,
}: {
  children: React.ReactNode;
  regs?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const { signedIn, address, openSignIn } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpaque, setDrawerOpaque] = useState(false);

  const mobileTabs = useMemo(
    () => flattenNavItems().filter((item) => (MOBILE_TAB_HREFS as readonly string[]).includes(item.href)),
    [],
  );

  const moreItems = useMemo(
    () => flattenNavItems().filter((item) => !(MOBILE_TAB_HREFS as readonly string[]).includes(item.href)),
    [],
  );

  return (
    <div className="relative min-h-[100dvh] bg-grid">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1440px]">
        <aside className="sticky top-0 hidden h-[100dvh] w-[264px] shrink-0 flex-col border-r border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-4 lg:flex bm-glass">
          <Link href="/" className={cn("mb-6 flex min-h-11 items-center gap-2.5 rounded-full px-2", focusRing)}>
            <Image
              src="/brand/logo/basemate-logo-flat.png"
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Basemate</span>
          </Link>

          <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto" aria-label="Basemate">
            {NAV_GROUPS.map((group) => (
              <div key={group.id}>
                {group.label ? (
                  <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <a
            href={IMESSAGE_HREF}
            className={cn(
              "mt-4 flex min-h-11 items-center gap-2 rounded-[20px] bg-primary px-4 text-[13px] font-semibold text-primary-foreground",
              focusRing,
            )}
          >
            <MessageCircle className="size-4" />
            <span className="font-mono">{SITE.imessagePhoneDisplay}</span>
          </a>

          <div className="mt-3">
            {signedIn ? (
              <Link
                href="/account/settings"
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full border border-border bg-card px-3",
                  focusRing,
                )}
              >
                <User className="size-4 text-muted-foreground" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] font-medium">Account</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {shortAddress(address) || "Settings"}
                  </p>
                </div>
                <Settings className="ml-auto size-3.5 text-muted-foreground" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border border-border bg-card px-4 text-[13px] font-medium",
                  focusRing,
                )}
              >
                Sign in
              </button>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 lg:hidden bm-glass">
            <Link href="/" className={cn("flex min-h-11 items-center gap-2", focusRing)}>
              <Image src="/brand/logo/basemate-logo-flat.png" alt="" width={28} height={28} className="rounded-lg" />
              <span className="text-[15px] font-semibold">Basemate</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {signedIn ? (
                <Link
                  href="/account"
                  className={cn("inline-flex min-h-11 items-center rounded-full border border-border px-3 text-[13px]", focusRing)}
                >
                  Account
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openSignIn}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-3 text-[13px]",
                    focusRing,
                  )}
                >
                  Sign in
                </button>
              )}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => {
                  setMoreOpen(true);
                  setDrawerOpaque(true);
                }}
                className={cn("inline-flex size-11 items-center justify-center rounded-full", focusRing)}
              >
                <Menu className="size-5" />
              </button>
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-[1120px] flex-1 px-6 pb-28 pt-6 lg:px-10 lg:pb-10">
            {children}
            {regs ? <div className="mt-12"><RegSFooter /></div> : null}
          </main>
        </div>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--glass-border)] pb-[env(safe-area-inset-bottom)] lg:hidden",
          drawerOpaque ? "bg-white" : "bm-glass",
        )}
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-[1120px] items-stretch justify-around px-1 py-1.5">
          {mobileTabs.map((item) => {
            const Icon = ICONS[item.icon];
            const active = navItemActive(item.href, pathname, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl"
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className={cn("text-[10px] font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(true);
              setDrawerOpaque(true);
            }}
            className="flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5"
          >
            <span className="flex h-8 w-12 items-center justify-center rounded-full text-muted-foreground">
              <Menu className="size-[18px]" />
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="More">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/20"
            aria-label="Close menu"
            onClick={() => {
              setMoreOpen(false);
              setDrawerOpaque(false);
            }}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-card px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[var(--shadow-modal)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">More</p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setMoreOpen(false);
                  setDrawerOpaque(false);
                }}
                className="inline-flex size-11 items-center justify-center rounded-full"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-1">
              {moreItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => {
                    setMoreOpen(false);
                    setDrawerOpaque(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
