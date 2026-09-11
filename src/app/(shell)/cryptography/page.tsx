import type { Metadata } from "next";
import { CRYPTO_FAMILIES, CRYPTO_TOOLS, CRYPTO_TOOL_IDS } from "@/lib/crypto";
import { ModuleIndex } from "@/components/shared/ModuleIndex";
import { FxCipher } from "@/components/viz/ModuleFx";

export const metadata: Metadata = {
  title: "Cryptography",
  description:
    "AES, DES, Triple DES, RSA, ECC, SHA-2, SHA-3 and hybrid encryption, all executed in the browser.",
};

export default function CryptographyHubPage() {
  return (
    <ModuleIndex
      eyebrow="Module 03 · Cryptography"
      title="Eight algorithms, one browser tab"
      lead="Keys derived in your browser, held for one operation, never logged."
      fx={<FxCipher />}
      groups={CRYPTO_FAMILIES.map((family) => ({
        label: family.label,
        entries: CRYPTO_TOOL_IDS.map((id) => CRYPTO_TOOLS[id])
          .filter((tool) => tool.family === family.family)
          .map((tool) => ({
            name: tool.label,
            meta: tool.tagline,
            href: `/cryptography/${tool.path}`,
            status: tool.status
              ? {
                  text: tool.status.text,
                  // A broken cipher has to look broken even on a page where
                  // the theme colour is doing all the other talking.
                  tone: tool.status.tone === "warn" ? ("warn" as const) : ("ok" as const),
                }
              : undefined,
          })),
      }))}
    />
  );
}
