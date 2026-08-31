/**
 * PEM wrapping for exported keys.
 *
 * WebCrypto exports keys as raw DER (SPKI for public, PKCS#8 for private). PEM
 * is just that DER in Base64 between two labelled lines — the form every other
 * tool in the ecosystem expects, and the only one a user can reasonably paste
 * between two browser tabs.
 */
import { base64ToBytes, bytesToBase64 } from "./bytes";

export type PemLabel = "PUBLIC KEY" | "PRIVATE KEY";

/** Wraps DER bytes as PEM, at the conventional 64 characters per line. */
export function toPem(der: Uint8Array, kind: PemLabel): string {
  const body = bytesToBase64(der).replace(/(.{64})/g, "$1\n").trim();
  return `-----BEGIN ${kind}-----\n${body}\n-----END ${kind}-----`;
}

/** Strips the armour and returns the DER bytes. */
export function fromPem(pem: string, kind: PemLabel): Uint8Array {
  const body = pem
    .replace(`-----BEGIN ${kind}-----`, "")
    .replace(`-----END ${kind}-----`, "")
    .replace(/\s+/g, "");

  if (!body) throw new Error(`Expected a ${kind} block`);
  return base64ToBytes(body);
}

/** True when the text carries the expected PEM header. */
export function looksLikePem(value: string, kind: PemLabel): boolean {
  return value.includes(`BEGIN ${kind}`);
}
