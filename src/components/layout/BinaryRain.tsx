/**
 * Binary field behind the hero.
 *
 * Generated from a fixed seed rather than `Math.random`. React renders this on
 * the server and again on the client, and two different random fields would be
 * a hydration mismatch — the digits would visibly rewrite themselves on load.
 * A seeded generator produces the same field in both passes.
 *
 * Rendered as text rather than a canvas so it costs nothing to paint and scales
 * with the page, and marked aria-hidden because it carries no meaning.
 */

/** Small deterministic PRNG — a linear congruential generator. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

interface BinaryRainProps {
  /** Number of vertical streams. */
  columns?: number;
  /** Digits per stream. */
  depth?: number;
}

export function BinaryRain({ columns = 26, depth = 70 }: BinaryRainProps) {
  const random = seeded(20260906);

  const streams = Array.from({ length: columns }, (_, index) => {
    const digits = Array.from({ length: depth }, () => (random() > 0.5 ? "1" : "0")).join("");
    return {
      key: index,
      digits,
      left: `${(index / columns) * 100 + random() * 2}%`,
      // Varied opacity and speed stop the field reading as a regular grid.
      opacity: 0.05 + random() * 0.13,
      duration: `${16 + random() * 26}s`,
      delay: `-${random() * 20}s`,
    };
  });

  return (
    <div aria-hidden className="phos-rain">
      {streams.map((stream) => (
        <span
          key={stream.key}
          className="phos-rain-col"
          style={{
            left: stream.left,
            opacity: stream.opacity,
            animationDuration: stream.duration,
            animationDelay: stream.delay,
          }}
        >
          {stream.digits}
        </span>
      ))}
    </div>
  );
}

export default BinaryRain;
