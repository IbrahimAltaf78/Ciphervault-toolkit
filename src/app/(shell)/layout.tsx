import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/layout/ScrollProgress";

/**
 * Application chrome.
 *
 * Everything the console needs around a page — skip link, backdrop grid,
 * navbar, gutter, footer, scroll indicator. It lives in a route group so the
 * cover page at `/` can opt out of all of it while every tool route keeps it,
 * and no URL changes: this file wraps `/stego`, `/console`, `/cryptography`
 * and the rest.
 */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* First stop in the tab order, visible only once focused. Without it a
          keyboard or screen-reader user tabs through the whole header on every
          page before reaching the tool they came for. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-phos focus:bg-phos-deep focus:px-4 focus:py-2 focus:text-phos"
      >
        Skip to content
      </a>

      <div aria-hidden className="phos-backdrop" />

      <div className="phos-above flex min-h-dvh flex-col">
        <Navbar />
        {/* Wide and tight: a console fills its housing. Pages set their own
            internal rhythm but never their own gutter, so routes line up. */}
        <main id="main" className="mx-auto w-full max-w-[88rem] flex-1 px-3 py-3 sm:px-4 sm:py-4">
          {children}
        </main>
        <Footer />
      </div>

      <ScrollProgress />
    </div>
  );
}
