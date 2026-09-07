"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Top navigation.
 *
 * Four destinations, always visible. There is no menu button and no drawer:
 * with this few links they fit on a phone by wrapping, and a hamburger that
 * hides four items costs a tap to reveal what would already have been on
 * screen.
 */
const LINKS = [
  { href: "/", label: "Suite Overview" },
  { href: "/stego", label: "Modules" },
  { href: "/steganalysis", label: "Forensics" },
  { href: "/cryptography", label: "Cryptography" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 bg-phos-void/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-2 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="phos-glow shrink-0 font-mono text-base font-bold tracking-tight text-phos-hot sm:text-lg"
        >
          CipherVault<span className="text-phos-dim"> Solutions</span>
        </Link>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1 sm:ml-auto">
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
      </nav>
    </header>
  );
}

export default Navbar;
