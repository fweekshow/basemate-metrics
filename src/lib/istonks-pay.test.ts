import { describe, expect, it } from "vitest";

import { formatUsdAmount, istonkPayCopy, shortGiftCardName } from "./istonks-pay";

describe("shortGiftCardName", () => {
  it("drops a trailing USA suffix", () => {
    expect(shortGiftCardName("Amazon.com USA")).toBe("Amazon.com");
  });
});

describe("istonkPayCopy", () => {
  it("keeps stock-send copy for gift_stock", () => {
    const copy = istonkPayCopy({
      formattedAmount: "$5",
      giftLabel: "AAPL",
      recipientDisplay: "Sam",
    });
    expect(copy.kind).toBe("stock");
    expect(copy.title).toBe("Add $5 to send AAPL");
    expect(copy.ogTitle).toBe("Send a stock on iMessage");
    expect(copy.subtitle).toContain("Sam");
  });

  it("uses gift-card copy for Bitrefill", () => {
    const copy = istonkPayCopy({
      isBitrefill: true,
      formattedAmount: "$5",
      productName: "Amazon.com USA",
    });
    expect(copy.kind).toBe("bitrefill");
    expect(copy.title).toBe("Add $5 for Amazon.com");
    expect(copy.ogTitle).toBe("Amazon.com gift card");
    expect(copy.subtitle).toContain("gift card");
    expect(copy.subtitle).not.toContain("stock");
    expect(copy.pollingSuccess).toContain("gift card");
    expect(copy.successDescription).toContain("Amazon.com gift card");
  });
});

describe("formatUsdAmount", () => {
  it("drops cents on whole dollars", () => {
    expect(formatUsdAmount(5)).toBe("$5");
  });
});
