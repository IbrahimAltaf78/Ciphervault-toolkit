"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

/**
 * Route error boundary.
 *
 * Without this file a thrown error takes down the segment and Next shows its
 * own crash screen — in development that is a stack trace, and in production a
 * blank page. Neither tells the visitor what to do next.
 *
 * The digest is surfaced deliberately. Production error messages are stripped
 * by the framework, so the digest is the only handle a user can quote when
 * reporting the fault, and the only one that ties their report to the log line.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reaches the browser console in development and whatever collector is
    // wired up in production.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="crt phos-corners phos-boot phos-sweep px-5 py-16 sm:px-8">
      <div className="relative z-[1] mx-auto max-w-lg space-y-6 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-md border border-red-800 bg-red-950/50 text-red-400">
          <AlertTriangle aria-hidden className="size-5" />
        </span>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-phos-white">
            This tool stopped
          </h1>
          <p className="text-pretty leading-relaxed text-phos-dim">
            Something in this module threw an error. Nothing you entered was
            sent anywhere or saved — the page holds no state once it unloads.
          </p>
        </div>

        {error.digest && (
          <p className="font-mono text-xs text-phos-dim">
            Reference{" "}
            <span className="text-phos">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="phos-btn text-sm">
            <RotateCcw aria-hidden className="size-3.5" />
            Try again
          </button>
          <Link href="/" className="cv-btn text-sm">
            <Home aria-hidden className="size-3.5" />
            Suite overview
          </Link>
        </div>
      </div>
    </div>
  );
}
