"use client";

import { SymmetricTool } from "@/components/cryptography/SymmetricTool";
import { AsymmetricTool } from "@/components/cryptography/AsymmetricTool";
import { HashingTool } from "@/components/cryptography/HashingTool";
import { HybridTool } from "@/components/cryptography/HybridTool";
import type { CryptoToolId } from "@/lib/crypto";

/**
 * Picks the panel shape for a tool.
 *
 * Unlike encoding and text hiding, the eight cryptography tools genuinely need
 * different inputs — a password and a mode selector, a key pair, a digest
 * comparison — so they get four panel shapes rather than one parameterised
 * component. The route stays a single catch-all; only the body varies.
 */
export function CryptoTool({ id }: { id: CryptoToolId }) {
  switch (id) {
    case "aes":
    case "des":
    case "3des":
      return <SymmetricTool id={id} />;
    case "rsa":
    case "ecc":
      return <AsymmetricTool id={id} />;
    case "sha256":
    case "sha3":
      return <HashingTool id={id} />;
    case "hybrid":
      return <HybridTool />;
  }
}

export default CryptoTool;
