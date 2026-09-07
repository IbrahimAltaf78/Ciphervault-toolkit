import Link from "next/link";

/**
 * Top bar.
 *
 * The wordmark alone. The four destination links were removed: every page
 * already reaches the next one — the landing page lists all six modules as
 * cards, each hub lists its own tools, and the status strip carries the two
 * shortcuts worth keeping — so the bar was repeating navigation that existed
 * a scroll away.
 *
 * No client hooks are needed now that nothing depends on the current route,
 * so this renders on the server.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-phos-void/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="phos-glow font-mono text-base font-bold tracking-tight text-phos-hot transition-colors hover:text-phos-white sm:text-lg"
        >
          CipherVault<span className="text-phos-dim"> Solutions</span>
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
