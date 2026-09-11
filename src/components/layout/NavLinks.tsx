"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The six modules, by their full names.
 *
 * These were short codes — STEGO, ANALYSIS, CRYPTO, TEXT — which saved a few
 * pixels and cost the meaning: "TEXT" does not tell anyone it means hiding a
 * message inside text. A first-time visitor should be able to read the navbar
 * and know what each module is for.
 */
const MODULES = [
  { label: "Steganography", href: "/stego" },
  { label: "Steganalysis", href: "/steganalysis" },
  { label: "Cryptography", href: "/cryptography" },
  { label: "Text Hiding", href: "/text-hiding" },
  { label: "Watermarking", href: "/watermark" },
  { label: "Encoding", href: "/encoding" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="order-3 flex flex-wrap items-center gap-x-5 gap-y-1 sm:order-none">
      {MODULES.map((module) => {
        // Active on the hub and on every tool page underneath it, so the bar
        // says which module you are in wherever you are in it.
        const isCurrent = pathname === module.href || pathname.startsWith(module.href + "/");
        return (
          <li key={module.href}>
            <Link
              href={module.href}
              aria-current={isCurrent ? "page" : undefined}
              className={`cv-navlink ${isCurrent ? "cv-navlink--active" : ""}`}
            >
              {module.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default NavLinks;
