"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Binary, KeyRound, ShieldCheck, Type } from "lucide-react";
import { PARADIGM_ACCENT } from "@/lib/paradigm-theme";
import type { Paradigm } from "@/types";

/** Routes wired so far. Remaining paradigms join as they ship. */
const NAV_LINKS = [
  { href: "/cryptography", label: "Cryptography", icon: KeyRound, paradigm: "cryptography" },
  { href: "/encoding", label: "Encoding", icon: Binary, paradigm: "encoding" },
  { href: "/text-hiding", label: "Text Hiding", icon: Type, paradigm: "text-hiding" },
] as const satisfies ReadonlyArray<{
  href: string;
  label: string;
  icon: typeof KeyRound;
  paradigm: Paradigm;
}>;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-edge/80 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-crypto/40 bg-crypto/15 text-crypto shadow-[0_0_22px_-6px_#8b5cf6]">
            <ShieldCheck aria-hidden className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Cipher<span className="text-crypto">Vault</span>
          </span>
        </Link>

        <ul className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{ "--cv-accent": PARADIGM_ACCENT[link.paradigm] } as React.CSSProperties}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                    isActive
                      ? "accent-soft accent-text"
                      : "text-muted hover:bg-edge/50 hover:text-foreground"
                  }`}
                >
                  <link.icon aria-hidden className="size-3.5" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <span className="cv-badge ml-auto hidden border-emerald-800 bg-emerald-950/60 text-emerald-400 sm:inline-flex">
          <span className="cv-pulse size-1.5 rounded-full bg-emerald-400" />
          Local · Stateless
        </span>
      </nav>
    </header>
  );
}

export default Navbar;
