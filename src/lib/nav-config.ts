export type NavVisibility = "public" | "teaser";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  visibility: NavVisibility;
  /** Exact match only (section roots). */
  exact?: boolean;
};

export type NavIcon = "home" | "activity" | "contacts" | "metrics" | "skills";

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
      { href: "/account", label: "Home", icon: "home", visibility: "teaser", exact: true },
      { href: "/account/activity", label: "Activity", icon: "activity", visibility: "teaser" },
      { href: "/account/contacts", label: "Contacts", icon: "contacts", visibility: "teaser" },
    ],
  },
  {
    id: "explore",
    label: "Explore",
    items: [
      { href: "/skills/send-stock", label: "Muse skill", icon: "skills", visibility: "public" },
      { href: "/metrics", label: "Metrics", icon: "metrics", visibility: "public" },
    ],
  },
] as const;

export const MOBILE_TAB_HREFS = ["/account", "/account/activity", "/account/contacts"] as const;

export const HASH_TO_PATH: Record<string, string> = {
  home: "/account",
  balance: "/account",
  account: "/account",
  activity: "/account/activity",
  sends: "/account/activity",
  contacts: "/account/contacts",
  settings: "/account/settings",
  payment: "/account/settings",
  payments: "/account/settings",
  you: "/account/settings",
  agent: "/account/settings",
  send: "/account?send=1",
  earn: "/account",
  yield: "/account",
  interest: "/account",
  earning: "/account",
  stonks: "/account",
  istonks: "/account",
  launch: "/account",
  launches: "/account",
  fees: "/account",
  skill: "/skills/send-stock",
  skills: "/skills/send-stock",
  muse: "/skills/send-stock",
};

export function resolveAppHash(rawHash: string): string {
  const raw = rawHash.replace(/^#/, "").trim().toLowerCase();
  if (!raw) return "/account";
  return HASH_TO_PATH[raw] ?? "/account";
}

export function navItemActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact || href === "/") return pathname === href;
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function flattenNavItems(): NavItem[] {
  return NAV_GROUPS.flatMap((g) => [...g.items]);
}
