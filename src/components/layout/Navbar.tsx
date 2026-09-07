import Link from "next/link";
import { CommandPalette } from "@/components/layout/CommandPalette";

/**
 * Top bar: the wordmark, and the way into every tool.
 *
 * The search field sits here rather than floating in a corner. Search is the
 * primary way to move around an app with thirty-five destinations and no menu,
 * and the top bar is the first place anyone looks for it — a control parked at
 * the bottom of the viewport is found by accident or not at all.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-phos-void/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="phos-glow shrink-0 font-mono text-base font-bold tracking-tight text-phos-hot transition-colors hover:text-phos-white sm:text-lg"
        >
          CipherVault<span className="text-phos-dim"> Solutions</span>
        </Link>

        <div className="ml-auto w-full sm:w-auto">
          <CommandPalette />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
