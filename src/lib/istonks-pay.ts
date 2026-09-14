export const ISTONK_PAY_OG_PATH = "/images/istonk-pay-og.png";
export const ISTONK_PAY_OG_WIDTH = 1024;
export const ISTONK_PAY_OG_HEIGHT = 576;

/** iStonk iMessage line — return-to-chat after Apple Pay. */
export const ISTONK_IMESSAGE_PHONE = "+16287895375";
export const ISTONK_IMESSAGE_HREF = `sms:${ISTONK_IMESSAGE_PHONE}?&body=${encodeURIComponent("gm")}`;

const TOKEN_RE = /^[a-f0-9]{21}$/i;

export function isFundSessionToken(value: string): boolean {
  return TOKEN_RE.test(value);
}

export function istonksApiHost(): string | undefined {
  return process.env.ISTONKS_API_HOST?.trim() || undefined;
}

export function shortGiftCardName(name: string): string {
  return name.replace(/\s+(USA|USD|US|Canada)\s*$/i, "").trim();
}

export function formatUsdAmount(amountUsd?: number): string | null {
  if (typeof amountUsd !== "number" || !Number.isFinite(amountUsd) || amountUsd <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amountUsd % 1 === 0 ? 0 : 2,
  }).format(amountUsd);
}

export function istonkPayCopy(input: {
  isBitrefill?: boolean;
  isGift?: boolean;
  productName?: string | null;
  giftLabel?: string | null;
  recipientDisplay?: string | null;
  formattedAmount?: string | null;
}) {
  const product = input.productName?.trim() ? shortGiftCardName(input.productName) : "";
  if (input.isBitrefill) {
    const card = product || "the gift card";
    return {
      kind: "bitrefill" as const,
      ogTitle: product ? `${product} gift card` : "Buy a gift card on iMessage",
      ogDescription: input.formattedAmount
        ? `Add ${input.formattedAmount} with Apple Pay. iStonk buys the gift card after it clears.`
        : "Apple Pay onramp to buy a gift card with USDC on Base.",
      title: input.formattedAmount ? `Add ${input.formattedAmount} for ${card}` : `Buy ${card}`,
      subtitle: "Buy USDC on Base with Apple Pay. iStonk buys the gift card after it clears.",
      pollingSuccess: "Done. Your USDC is on its way — iStonk will buy the gift card.",
      successDescription: product
        ? `iStonk is buying the ${product} gift card now. You'll get a text when the code lands.`
        : "iStonk is buying the gift card now. You'll get a text when the code lands.",
      successOgDescription: "iStonk is buying the gift card now.",
    };
  }

  if (input.isGift || input.giftLabel) {
    return {
      kind: "stock" as const,
      ogTitle: "Send a stock on iMessage",
      ogDescription: "Apple Pay onramp to buy a tokenized stock and send it to a phone number.",
      title: input.formattedAmount
        ? `Add ${input.formattedAmount} to send ${input.giftLabel ?? "the stock"}`
        : "Fund your iStonk send",
      subtitle: input.recipientDisplay
        ? `Buy USDC on Base with Apple Pay, then iStonk sends it to ${input.recipientDisplay}.`
        : "Buy USDC on Base with Apple Pay. iStonk buys the stock and sends it after it clears.",
      pollingSuccess: "Done. Your USDC is on its way — iStonk will buy and send the stock.",
      successDescription: input.giftLabel
        ? `iStonk is buying ${input.giftLabel}${input.recipientDisplay ? ` for ${input.recipientDisplay}` : ""} now. You'll get a text when it lands.`
        : "iStonk is buying and sending the stock now. You'll get a text when it lands.",
      successOgDescription: "iStonk is buying the stock and sending it now.",
    };
  }

  return {
    kind: "fund" as const,
    ogTitle: "Add funds on iMessage",
    ogDescription: "Buy USDC on Base with Apple Pay.",
    title: input.formattedAmount ? `Add ${input.formattedAmount} to your account` : "Fund your iStonk account",
    subtitle: "Buy USDC on Base with Apple Pay.",
    pollingSuccess: "Done. Your USDC is on its way to your iStonk account.",
    successDescription: "Your USDC is on its way. You'll get a text when it lands.",
    successOgDescription: "Your USDC is on its way to your iStonk account.",
  };
}
