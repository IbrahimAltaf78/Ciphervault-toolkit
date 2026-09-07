import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

/**
 * 404.
 *
 * Without this file Next serves its own black-and-white page, which drops the
 * visitor out of the product entirely — the one moment they are already
 * confused is the worst moment to show them a different application.
 *
 * It also offers a way onward. A dead end that only says "not found" makes the
 * visitor use the back button; naming the likely destinations does not.
 */
export default function NotFound() {
  return (
    <div className="crt phos-corners px-5 py-16 sm:px-8">
      <div className="relative z-[1] mx-auto max-w-lg space-y-6 text-center">
        <span className="phos-tile mx-auto">
          <FileQuestion aria-hidden className="size-5" />
        </span>

        <p className="font-mono text-6xl font-black tracking-tight text-phos-dim">
          404
        </p>

        <div className="space-y-2">
          <h1 className="phos-glow text-2xl font-bold tracking-tight text-phos-white">
            No such route
          </h1>
          <p className="text-pretty leading-relaxed text-phos-dim">
            That address does not match any tool in the suite. It may have moved
            during the route migration, or the link may be mistyped.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="phos-btn text-sm">
            <ArrowLeft aria-hidden className="size-3.5" />
            Suite overview
          </Link>
          <Link href="/cryptography" className="cv-btn text-sm">Cryptography</Link>
          <Link href="/stego" className="cv-btn text-sm">Steganography</Link>
          <Link href="/steganalysis" className="cv-btn text-sm">Steganalysis</Link>
        </div>
      </div>
    </div>
  );
}
