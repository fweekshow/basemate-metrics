export type NavVisibility = "public" | "teaser";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  visibility: NavVisibility;
  /** Exact match only (section roots). */
  exact?: boolean;
};

export type NavIcon =
  | "home"
  | "account"
  | "earn"
  | "activity"
  | "contacts"
  | "istonks"
  | "launch"
  | "fees"
  | "launches"
  | "stocks"
  | "metrics"
  | "stablecoins";

export type NavGroup = {
  id: string;
  label: string | null;
  items: readonly NavItem[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "you",
    label: "You",
    items: [
      { href: "/", label: "Home", icon: "home", visibility: "public", exact: true },
      { href: "/account", label: "Account", icon: "account", visibility: "teaser", exact: true },
      { href: "/account/earn", label: "Earn", icon: "earn", visibility: "teaser" },
      { href: "/account/activity", label: "Activity", icon: "activity", visibility: "teaser" },
      { href: "/account/contacts", label: "Contacts", icon: "contacts", visibility: "teaser" },
    ],
  },
  {
    id: "launch",
    label: "Launch",
    items: [
      { href: "/istonks/launch", label: "Launch", icon: "launch", visibility: "teaser" },
      { href: "/account/launches", label: "Your launches", icon: "launches", visibility: "teaser" },
      { href: "/istonks/fees", label: "Fees", icon: "fees", visibility: "teaser" },
    ],
  },
  {
    id: "explore",
    label: "Explore",
    items: [
      { href: "/istonks", label: "iStonks", icon: "istonks", exact: true, visibility: "public" },
      { href: "/istonks/stocks", label: "Stocks", icon: "stocks", visibility: "public" },
      { href: "/metrics", label: "Metrics", icon: "metrics", visibility: "public" },
      { href: "/stablecoins", label: "Stablecoins", icon: "stablecoins", visibility: "public" },
    ],
  },
] as const;

export const MOBILE_TAB_HREFS = ["/", "/account", "/istonks", "/istonks/launch"] as const;

export const HASH_TO_PATH: Record<string, string> = {
  home: "/",
  balance: "/account",
  activity: "/account/activity",
  sends: "/account/activity",
  earn: "/account/earn",
  yield: "/account/earn",
  interest: "/account/earn",
  earning: "/account/earn",
  stonks: "/istonks",
  istonks: "/istonks",
  launch: "/istonks",
  launches: "/istonks",
  fees: "/istonks/fees",
  contacts: "/account/contacts",
  settings: "/account/settings",
  payment: "/account/settings",
  payments: "/account/settings",
  you: "/account/settings",
  agent: "/account/settings",
  send: "/account?send=1",
};

export function resolveAppHash(rawHash: string): string {
  const raw = rawHash.replace(/^#/, "").trim().toLowerCase();
  if (!raw) return "/account";
  return HASH_TO_PATH[raw] ?? "/account";
}

export function navItemActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact || href === "/") return pathname === href;
  if (href === "/account") return pathname === "/account";
  if (href === "/istonks") return pathname === "/istonks";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function flattenNavItems(): NavItem[] {
  return NAV_GROUPS.flatMap((g) => [...g.items]);
}
