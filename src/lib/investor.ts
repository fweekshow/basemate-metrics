import { DECKS } from "@/lib/decks";
import { SITE } from "@/lib/site";

export const INVESTOR = {
  round: "Pre-seed",
  year: "2026",
  status: "Pre-seed, actively closing",
  target: "$500K",
  targetNote: "Brings the first node online — Singapore ⇄ Indonesia",
  pending: "$20K",
  pendingNote: "Soft-circled — first close in progress",
  committed: "$0",
  committedNote: "Wired / docs signed",
  contactEmail: "mateo@basemate.app",
  metricsUrl: SITE.metricsUrl,
  headline: "Money that lives in your texts.",
  subhead:
    "We put money in the chats people already live in. No new app, no wallet, no crypto explainer. Text Stablemate and the transfer happens, to anyone, anywhere. The rails underneath are local stablecoins; the person sending never has to know that.",

  /** Slide 2 — the gap. */
  gap: [
    { value: "25+", label: "local stablecoins live on Base" },
    { value: "$857B", label: "sent across borders every year" },
    { value: "6.36%", label: "average fee to send money home · 14.99% through a bank" },
  ],

  /** Slide 3 — how a send works, end to end. */
  product: [
    {
      step: "01",
      title: "Text your country's number",
      body: "That first message is the signup. We create the wallet for you, abstracted behind your email. No seed phrase, no app required.",
    },
    {
      step: "02",
      title: "Send to any number, anywhere",
      body: "Not just your corridor. Any phone number on earth, whether or not they have ever heard of Stablemate.",
    },
    {
      step: "03",
      title: "Receive the same way",
      body: "Money in and money out both arrive as a text into your Stablemate Account. One thread is the whole interface.",
    },
    {
      step: "04",
      title: "It lands in local money",
      body: "XSGD in, IDRX out, auto-converted on arrival and cashed out by the licensed ramp in that market.",
    },
  ],

  /** Slide 4 — the three layers we own. */
  networkLayers: [
    {
      title: "Number layer",
      body: "In-country numbers via Photon. One per market, on iMessage and WhatsApp.",
    },
    {
      title: "Account layer",
      body: "One Stablemate Account per phone number. Sends and receives land as text, in the same thread.",
    },
    {
      title: "Routing layer",
      body: "Settlement and auto-swap on Base. The licensed ramp in each market does the regulated leg.",
    },
  ],

  /** Slide 5 — the deal we offer an issuer. */
  deal: [
    {
      title: "We bring the users and the chat",
      body: "The number, the account layer and the front door that looks like a normal text. Most people will never mint a stablecoin. They will text.",
    },
    {
      title: "You bring the licence and the money",
      body: "The banks, the on and off ramps, mint and redeem, and the decision to release funds. We never hold local currency and never override you.",
    },
    {
      title: "One partner per market, every currency welcome",
      body: "We back no currency over another. Within your market you are the only rail on our number, so every user comes through you.",
    },
    {
      title: "Every node makes the next worth more",
      body: "Apps compete for users; networks compound them. Node four is worth more than node one to every issuer already connected.",
    },
  ],

  /** Slide 6 / one-pager — one partner per node. */
  nodes: [
    {
      flag: "🇺🇸",
      country: "United States",
      ticker: "USDC",
      status: "LIVE",
      note: "Where the rail was proven. Live on iMessage today.",
    },
    {
      flag: "🇮🇩",
      country: "Indonesia",
      ticker: "IDRX",
      status: "CLOSING",
      note: "Rupiah stablecoin on Base. Receiving side of the first corridor.",
    },
    {
      flag: "🇸🇬",
      country: "Singapore",
      ticker: "XSGD",
      status: "IN TALKS",
      note: "Regulated hub and the outbound sender side of the first corridor.",
    },
    {
      flag: "🇲🇾",
      country: "Malaysia",
      ticker: "MYRC",
      status: "IN TALKS",
      note: "Ringgit stablecoin from BLOX, plugged into the same network.",
    },
    {
      flag: "🇯🇵",
      country: "Japan",
      ticker: "JPYC",
      status: "SEARCHING",
      note: "Licensed yen stablecoin. High iMessage penetration.",
    },
  ],

  /** Slide 7 — business model. */
  businessModel: {
    note: "Two lines, both tied to volume rather than headcount. Every send converts, and every balance sits somewhere. Pre-revenue today — the first paying corridor lands with this pre-seed.",
    lines: [
      {
        label: "Conversion",
        value: "0.42%",
        body: "On every auto-conversion into the local stablecoin (USDC → IDRX, XSGD → IDRX). Scales directly with corridor volume.",
      },
      {
        label: "Yield",
        value: "The float",
        body: "A cut of user yield on idle balances held across the network. It compounds with every node added.",
      },
    ],
    example: {
      label: "Sending $200 · a worked example",
      rows: [
        { label: "Incumbent, all-in", value: "$12.72", note: "6.36% global average" },
        { label: "Stablemate conversion leg", value: "$0.84", note: "0.42% swap" },
        {
          label: "Plus the ramp's own fee",
          value: "—",
          note: "Set in-market by the licensed partner, not by us",
        },
      ],
    },
  },

  /** Slide 9 — the stack. */
  partners: [
    { name: "Photon", status: "LIVE · NUMBER INVENTORY", body: "iMessage and RCS delivery, and in-country numbers across five markets." },
    { name: "Definitive", status: "LIVE · SWAPS", body: "Powers every in-thread swap and the auto-conversion into local stablecoins." },
    { name: "Base", status: "LIVE · SETTLEMENT", body: "Every send, receive and swap settles on Base." },
    { name: "IDRX", status: "CLOSING · INDONESIA", body: "The rupiah stablecoin on Base. Receiving side of the first corridor." },
    { name: "StraitsX", status: "IN TALKS · SINGAPORE", body: "XSGD and the regulated ramp on the sending side." },
    { name: "BLOX", status: "IN TALKS · MALAYSIA", body: "MYRC and the banking stack for ringgit in and out." },
  ],

  milestone: {
    label: "12 months of runway",
    items: [
      { value: "SG ⇄ ID", label: "first corridor live by end of year, money moving both ways" },
      { value: "10,000", label: "users on the network" },
      { value: "2 + 3", label: "nodes live, plus three more signed and ready to go" },
    ],
  },

  useOfFunds: [
    {
      title: "On the ground",
      body: "The team in Singapore and Jakarta, building the corridor alongside the local operators.",
    },
    {
      title: "Partnerships",
      body: "Closing the node partners already in talks.",
    },
    {
      title: "Legal & compliance",
      body: "Node agreements, audits and security review.",
    },
    {
      title: "Number inventory",
      body: "Photon numbers across the first five markets.",
    },
  ],

  traction: [
    { value: "12,413", label: "total users since launch" },
    { value: "345", label: "active in last 7 days" },
    { value: "68,116", label: "messages delivered" },
  ],

  needs: [
    {
      title: "Issuer intros",
      body: "Warm intros to BD at local-currency stablecoin issuers — StraitsX, IDRX, BLOX, JPYC, Coins.ph, and anyone launching under new APAC frameworks.",
    },
    {
      title: "Ramps and counsel",
      body: "On/off-ramp operators licensed in Indonesia, Singapore, the Philippines, and Japan — plus counsel who can stand behind licensed partners as the entity of record.",
    },
    {
      title: "A believer",
      body: "Someone who has watched distribution moats get built. The connections we’re wiring — carriers, issuers, in-thread accounts — aren’t something a new team reproduces next quarter.",
    },
  ],

  team: [
    {
      name: "Matthew Meakin",
      role: "Founder & CEO",
      bio: "Former private interventionist to high-profile clients — trust was the whole job. Built the Base Event Agents, deployed at Basecamp 2025 and DevConnect. Base Batches 002. Owns narrative, GTM and Base relationships.",
    },
    {
      name: "Risavdeb Petra",
      role: "Co-Founder & CTO",
      bio: "Full-stack engineer building on Base since its earliest days — frontend, backend, cloud infrastructure and onchain integrations. Owns the rail, the wallets and the onchain stack.",
    },
    {
      name: "Aritra Roy",
      role: "Co-Founder & Engineer",
      bio: "Backend and systems engineer building scalable, real-world software.",
    },
    {
      name: "Michael Gale",
      role: "Co-Founder & CBO",
      bio: "Two startups built and exited in web2. Onchain full-time since 2021. Growth and partnerships.",
    },
  ],

  documents: [
    {
      ...DECKS.main,
      blurb: "Flagship pre-seed deck — the full story, product, network, and ask.",
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
