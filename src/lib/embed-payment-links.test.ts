import { describe, expect, it } from "vitest";

import { isHostedCoinbaseOnrampUrl, resolveEmbeddablePaymentLinks } from "./embed-payment-links";

describe("isHostedCoinbaseOnrampUrl", () => {
  it("treats select-asset as hosted", () => {
    expect(
      isHostedCoinbaseOnrampUrl("https://pay.coinbase.com/buy/select-asset?sessionToken=abc"),
    ).toBe(true);
  });

  it("treats guest Apple Pay as embeddable", () => {
    expect(isHostedCoinbaseOnrampUrl("https://pay.coinbase.com/guest/apple/mock")).toBe(false);
  });
});

describe("resolveEmbeddablePaymentLinks", () => {
  it("keeps guest Apple Pay options for iframe", () => {
    const options = resolveEmbeddablePaymentLinks({
      paymentLinkOptions: [
        {
          method: "apple_pay",
          label: "Apple Pay",
          url: "https://pay.coinbase.com/guest/apple/mock",
        },
      ],
    });
    expect(options).toHaveLength(1);
    expect(options[0]?.url).toContain("/guest/apple/");
  });
});
