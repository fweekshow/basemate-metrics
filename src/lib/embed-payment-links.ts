export interface FundPaymentLinkOption {
  method: "apple_pay" | "google_pay";
  label: "Apple Pay" | "Google Pay";
  url: string;
}

/** Coinbase-hosted redirect/widget — not the headless Apple Pay iframe URL. */
export function isHostedCoinbaseOnrampUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "pay.coinbase.com") return false;
    if (parsed.pathname.includes("/buy/select-asset")) return true;
    if (parsed.pathname.startsWith("/v3/sell")) return true;
    if (parsed.pathname.includes("/guest")) return false;
    return parsed.searchParams.has("sessionToken");
  } catch {
    return false;
  }
}

function isFundPaymentLinkOption(value: unknown): value is FundPaymentLinkOption {
  if (!value || typeof value !== "object") return false;
  const option = value as Partial<FundPaymentLinkOption>;
  return (
    (option.method === "apple_pay" || option.method === "google_pay") &&
    (option.label === "Apple Pay" || option.label === "Google Pay") &&
    typeof option.url === "string" &&
    option.url.startsWith("https://")
  );
}

/** Headless embed URLs for CDP iframe checkout (matches agent fundSession parse fallback). */
export function resolveEmbeddablePaymentLinks(input: {
  paymentLinkUrl?: string;
  paymentLinkOptions?: unknown[];
}): FundPaymentLinkOption[] {
  const fromOptions = (input.paymentLinkOptions ?? []).filter(isFundPaymentLinkOption);
  const embeddable = fromOptions.filter((o) => !isHostedCoinbaseOnrampUrl(o.url));
  if (embeddable.length > 0) return embeddable;

  const url = input.paymentLinkUrl?.trim();
  if (!url || url === "pending://checkout" || isHostedCoinbaseOnrampUrl(url)) {
    return [];
  }

  const google = url.toLowerCase().includes("google");
  return [
    {
      method: google ? "google_pay" : "apple_pay",
      label: google ? "Google Pay" : "Apple Pay",
      url,
    },
  ];
}
