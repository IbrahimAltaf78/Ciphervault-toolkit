/**
 * Route-level loading state.
 *
 * Shown while a segment streams in. Without it a slow route leaves the previous
 * page on screen with no sign anything is happening, and the visitor clicks
 * again.
 */
export default function Loading() {
  return (
    <div className="crt px-5 py-20">
      <div className="relative z-[1] flex flex-col items-center gap-4">
        <span className="phos-dot" aria-hidden />
        <p
          role="status"
          className="font-mono text-xs uppercase tracking-widest text-phos-dim"
        >
          Loading module
        </p>
      </div>
    </div>
  );
}
