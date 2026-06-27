import { decodeProlink } from "@base-org/account/prolink";

/** A single EIP-5792 call, as carried inside a `wallet_sendCalls` prolink. */
export type SignCall = {
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: `0x${string}`;
};

/** The `wallet_sendCalls` request a `/sign` prolink decodes to. */
export type SignRequest = {
  version: string;
  chainId: `0x${string}`;
  /** Base Account the calldata was built for — the user must sign from this one. */
  from: `0x${string}`;
  calls: SignCall[];
};

/**
 * Decode a prolink into the `wallet_sendCalls` request we replay in the browser.
 *
 * Runs on the server (Node prolink decoder) so the client bundle only ships the
 * Base Account SDK. Returns `null` for anything that isn't a well-formed
 * `wallet_sendCalls` payload — callers should treat that as a 404.
 */
export async function decodeSignRequest(prolink: string): Promise<SignRequest | null> {
  let decoded: Awaited<ReturnType<typeof decodeProlink>>;
  try {
    decoded = await decodeProlink(prolink);
  } catch {
    return null;
  }

  if (decoded.method !== "wallet_sendCalls") return null;

  const call = Array.isArray(decoded.params)
    ? (decoded.params[0] as Record<string, unknown> | undefined)
    : undefined;
  if (!call) return null;

  const { version, chainId, from, calls } = call as {
    version?: unknown;
    chainId?: unknown;
    from?: unknown;
    calls?: unknown;
  };

  if (typeof chainId !== "string" || typeof from !== "string") return null;
  if (!Array.isArray(calls) || calls.length === 0) return null;

  return {
    version: typeof version === "string" ? version : "2.0.0",
    chainId: chainId as `0x${string}`,
    from: from as `0x${string}`,
    calls: calls as SignCall[],
  };
}
