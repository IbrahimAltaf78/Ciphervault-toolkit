import Link from "next/link";
import { CommandPalette } from "@/components/layout/CommandPalette";

/**
 * Top bar: the wordmark, the six modules, and the way into every tool.
 *
 * The module links are spelled out rather than hidden behind a hamburger or
 * left to search alone. Six destinations fit on one line, and a reader who can
 * see the whole surface of a tool on arrival understands its shape without
 * clicking anything. Search stays for the thirty-five leaves below them.
 */
const MODULES = [
  { label: "stego", href: "/stego" },
  { label: "analysis", href: "/steganalysis" },
  { label: "crypto", href: "/cryptography" },
  { label: "text", href: "/text-hiding" },
  { label: "watermark", href: "/watermark" },
  { label: "encoding", href: "/encoding" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-phos-void/92 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 sm:px-8">
        {/* Points at the console, not at `/`. `/` is the cover page; once
            someone is inside the toolkit the wordmark should return them to
            the dashboard, not back out to the front door. */}
        <Link
          href="/console"
          className="shrink-0 font-mono text-sm font-bold tracking-tight text-phos-white transition-colors hover:text-phos"
        >
          CipherVault
          {/* The accent square is the whole logo. A wordmark plus one mark is
              cheaper to read at 14px than a wordmark plus a second word. */}
          <span aria-hidden className="ml-1.5 inline-block size-1.5 translate-y-[-1px] bg-phos" />
        </Link>

        <ul className="order-3 flex flex-wrap items-center gap-x-5 gap-y-1 sm:order-none">
          {MODULES.map((module) => (
            <li key={module.href}>
              <Link
                href={module.href}
                className="cv-label transition-colors hover:text-phos"
              >
                {module.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto w-full sm:w-64">
          <CommandPalette />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
