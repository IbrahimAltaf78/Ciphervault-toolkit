"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * Top navigation, in the phosphor treatment.
 *
 * Trimmed to four destinations plus the call to action. The previous bar
 * carried a link per module, which is a table of contents rather than a
 * navigation — the landing page already lists every module as a card, so the
 * bar only needs to reach the places a card does not.
 */
const LINKS = [
  { href: "/", label: "Suite Overview" },
  { href: "/stego", label: "Modules" },
  { href: "/steganalysis", label: "Forensics" },
  { href: "/cryptography", label: "Cryptography" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 bg-phos-void/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="phos-glow shrink-0 font-mono text-base font-bold tracking-tight text-phos-hot sm:text-lg"
        >
          CipherVault<span className="text-phos-dim"> Solutions</span>
        </Link>

        <ul className="ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`text-sm transition-colors ${
                  isCurrent(link.href)
                    ? "phos-glow text-phos-hot"
                    : "text-phos-dim hover:text-phos-hot"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/encoding" className="phos-btn ml-auto text-sm md:ml-0">
          Get Started
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="phos-btn px-2.5 md:hidden"
        >
          {isMenuOpen ? (
            <X aria-hidden className="size-4" />
          ) : (
            <Menu aria-hidden className="size-4" />
          )}
        </button>
      </nav>

      {isMenuOpen && (
        <div id="mobile-nav" className="border-t border-phos-line md:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-5 py-2 sm:px-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  className={`block py-2.5 text-sm transition-colors ${
                    isCurrent(link.href)
                      ? "phos-glow text-phos-hot"
                      : "text-phos-dim hover:text-phos-hot"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export default Navbar;
