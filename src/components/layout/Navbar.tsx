import Link from "next/link";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NavLinks } from "@/components/layout/NavLinks";

/**
 * Top bar: the wordmark, the six modules, and the way into every tool.
 *
 * The module links are spelled out in full rather than hidden behind a
 * hamburger or abbreviated. A reader who can see the whole surface of the
 * suite on arrival — and read what each part is called — understands its
 * shape without clicking anything. Search stays for the leaves below them.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-phos-void/92 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-3 px-5 py-3.5 sm:px-8">
        {/* Points at the console, not at `/`. `/` is the cover page; once
            someone is inside the toolkit the wordmark should return them to
            the dashboard, not back out to the front door. */}
        <Link
          href="/console"
          className="shrink-0 font-mono text-sm font-bold tracking-tight text-phos-white transition-colors hover:text-phos"
        >
          CipherVault
          {/* The accent square is the whole logo. */}
          <span aria-hidden className="ml-1.5 inline-block size-1.5 translate-y-[-1px] bg-phos" />
        </Link>

        {/* Client component: it reads the current path to mark the module
            you are in. */}
        <NavLinks />

        <div className="ml-auto w-full sm:w-56">
          <CommandPalette />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
