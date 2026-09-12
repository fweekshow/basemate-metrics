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
