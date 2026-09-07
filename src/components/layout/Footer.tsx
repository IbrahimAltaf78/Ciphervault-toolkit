import Link from "next/link";

/**
 * Terminal status strip.
 *
 * Modelled on the status line an instrument or a TUI keeps pinned to the
 * bottom: what is running, what mode it is in, where the work happens. Every
 * readout here is a fact about the app rather than decoration — the local-only
 * claim in particular is the one thing a user of a cryptography tool most needs
 * to be able to check.
 */
const READOUTS = [
  { key: "Build", value: "v1.0" },
  { key: "Modules", value: "6 online" },
  { key: "Execution", value: "client-side" },
  { key: "Storage", value: "none" },
];

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-5 pb-6 sm:px-8">
      <div className="phos-status">
        <span className="flex items-center gap-2 text-phos">
          <span className="phos-dot" aria-hidden />
          System nominal
        </span>

        {READOUTS.map((readout) => (
          <span key={readout.key}>
            {readout.key}
            <span className="text-phos-line"> :: </span>
            <span className="text-phos">{readout.value}</span>
          </span>
        ))}

        <span className="ml-auto flex items-center gap-4">
          <Link href="/steganalysis" className="transition-colors hover:text-phos-hot">
            Forensics
          </Link>
          <Link href="/cryptography" className="transition-colors hover:text-phos-hot">
            Crypto
          </Link>
          <span className="text-phos-line">CipherVault Solutions</span>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
