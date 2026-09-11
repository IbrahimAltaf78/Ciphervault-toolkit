"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ModuleNavItem {
  label: string;
  href: string;
}

interface ModuleNavProps {
  /** Names the nav for assistive tech, e.g. "Encoding tools". */
  label: string;
  items: ModuleNavItem[];
  /** The module's hub. The nav is hidden there — the hub already lists every
   *  tool as a tile, and a chip row above the tiles would say it twice. */
  hub: string;
}

/**
 * Switcher across one module's tools, shown above every tool page.
 *
 * The same chip row the cryptography tools have always carried (CryptoNav),
 * generalised so every module gets it. It lives in each module's layout, so
 * one file covers every tool page in that module and a new tool page picks it
 * up without being edited.
 */
export function ModuleNav({ label, items, hub }: ModuleNavProps) {
  const pathname = usePathname();
  if (pathname === hub) return null;

  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => {
        const isCurrent = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
              isCurrent
                ? "accent-soft accent-border accent-text"
                : "border-edge text-muted hover:border-phos-dim hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default ModuleNav;
