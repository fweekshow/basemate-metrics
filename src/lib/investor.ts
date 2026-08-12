import { DECKS } from "@/lib/decks";
import { SITE } from "@/lib/site";

export const INVESTOR = {
  round: "Seed",
  year: "2026",
  status: "Pre-seed, actively closing",
  target: "$1M",
  targetNote: "Lights up the first five country nodes",
  pending: "$20K",
  pendingNote: "Soft-circled — first close in progress",
  committed: "$0",
  committedNote: "Wired / docs signed",
  contactEmail: "mateo@basemate.app",
  metricsUrl: SITE.metricsUrl,
  headline: "Access only counts if everyone can reach it.",
  subhead:
    "Our mission: put Base on a local cell phone in every country. Stablecoins first — then the full Base stack. Send money to anyone, anywhere, with just a text. No app. No seed phrase.",
  milestone: {
    label: "Q3 2027",
    items: [
      { value: "5", label: "countries signed" },
      { value: "5", label: "issuers onboard" },
      { value: "25k", label: "users on the network" },
    ],
  },
  traction: [
    { value: "12,413", label: "total users" },
    { value: "445", label: "weekly active" },
    { value: "64,810", label: "messages handled" },
  ],
  needs: [
    {
      title: "Issuer intros",
      body: "Warm intros to BD at local-currency stablecoin issuers — StraitsX, IDRX, JPYC, Coins.ph, and anyone launching under new APAC frameworks.",
    },
    {
      title: "Ramps and counsel",
      body: "On/off-ramp operators licensed in Indonesia, Singapore, the Philippines, and Japan — plus counsel who can stand behind licensed partners as the entity of record.",
    },
    {
      title: "A believer",
      body: "Someone who has watched distribution moats get built. The connections and network we’re wiring — carriers, issuers, in-thread wallets — aren’t something a new team reproduces next quarter.",
    },
  ],
  team: [
    { name: "Matthew Meakin", role: "Founder & CEO" },
    { name: "Risavdeb Petra", role: "Co-Founder & CTO" },
    { name: "Aritra Roy", role: "Co-Founder & Engineer" },
    { name: "Michael Gale", role: "Co-Founder & CBO" },
  ],
  documents: [
    {
      ...DECKS.main,
      blurb: "Flagship seed deck — the full story, product, network, and ask.",
      badge: "Primary",
    },
    {
      ...DECKS.onepager,
      blurb: "One-page overview for a fast share ahead of a call.",
      badge: "Overview",
    },
    {
      ...DECKS.update,
      blurb: "August 2026 update — traction, the decision, and raise status.",
      badge: "Update",
    },
  ],
} as const;
