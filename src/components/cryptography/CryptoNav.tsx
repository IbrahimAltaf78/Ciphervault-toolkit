import Link from "next/link";
import { CRYPTO_TOOLS, CRYPTO_TOOL_IDS, type CryptoToolId } from "@/lib/crypto";

/** Switcher across the eight cryptography tools, shown above every panel. */
export function CryptoNav({ current }: { current: CryptoToolId }) {
  return (
    <nav aria-label="Cryptography tools" className="flex flex-wrap gap-2">
      {CRYPTO_TOOL_IDS.map((id) => {
        const tool = CRYPTO_TOOLS[id];
        const isCurrent = id === current;
        return (
          <Link
            key={id}
            href={`/cryptography/${tool.path}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
              isCurrent
                ? "accent-soft accent-border accent-text"
                : "border-edge text-muted hover:border-phos-dim hover:text-foreground"
            }`}
          >
            {tool.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default CryptoNav;
