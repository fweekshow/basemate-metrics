import { inflateRawSync } from "node:zlib";

/** A single EIP-5792 call, as carried inside a `/sign` tx payload. */
export type SignCall = {
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: `0x${string}`;
};

/** The `wallet_sendCalls` request a `/sign` tx payload decodes to. */
export type SignRequest = {
  version: string;
  chainId: `0x${string}`;
  /** Base Account the calldata was built for — the user must sign from this one. */
  from: `0x${string}`;
  calls: SignCall[];
};

const HEX_RE = /^0x[0-9a-fA-F]*$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** Even-length hex (`0x` + pairs) — calldata must be whole bytes. */
function isByteHex(value: unknown): value is `0x${string}` {
  return typeof value === "string" && HEX_RE.test(value) && value.length % 2 === 0;
}

function isQuantityHex(value: unknown): value is `0x${string}` {
  return typeof value === "string" && HEX_RE.test(value);
}

function decodeBase64Url(payload: string): string {
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  return inflateRawSync(Buffer.from(b64, "base64")).toString("utf8");
}

/**
 * Decode a `tx` payload into the `wallet_sendCalls` request we replay in the
 * browser. Built by {@link buildBaseAppTxLink} in the backend as
 * `base64url(deflateRaw(json))`.
 *
 * Runs on the server so the client bundle only ships the Base Account SDK.
 * Returns `null` for anything malformed — callers should treat that as a 404.
 * We reject odd-length calldata up front: that's exactly the corruption the old
 * prolink encoding produced, and Coinbase rejects it at signing time.
 */
export function decodeSignRequest(payload: string): SignRequest | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const { version, chainId, from, calls } = parsed as Record<string, unknown>;

  if (!isQuantityHex(chainId)) return null;
  if (!ADDRESS_RE.test(from as string)) return null;
  if (!Array.isArray(calls) || calls.length === 0) return null;

  const normalized: SignCall[] = [];
  for (const raw of calls) {
    if (!raw || typeof raw !== "object") return null;
    const { to, data, value } = raw as Record<string, unknown>;
    if (!ADDRESS_RE.test(to as string)) return null;
    if (data !== undefined && !isByteHex(data)) return null;
    if (value !== undefined && !isQuantityHex(value)) return null;
    normalized.push({
      to: to as `0x${string}`,
      data: (data as `0x${string}`) ?? "0x",
      value: (value as `0x${string}`) ?? "0x0",
    });
  }

  return {
    version: typeof version === "string" ? version : "2.0.0",
    chainId: chainId as `0x${string}`,
    from: from as `0x${string}`,
    calls: normalized,
  };
}
