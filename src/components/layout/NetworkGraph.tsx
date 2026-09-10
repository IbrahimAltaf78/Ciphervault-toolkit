/**
 * Node mesh behind the masthead.
 *
 * Built from a fixed seed rather than `Math.random`. React renders this on the
 * server and again on the client, and two different meshes would be a
 * hydration mismatch — the graph would visibly redraw itself on load.
 *
 * Inline SVG rather than canvas: it costs nothing to paint, scales with the
 * viewport, and the links and nodes can be animated from CSS (`.cv-net-link`,
 * `.cv-net-node`, `.cv-net-halo` in globals.css) so no JavaScript runs after
 * the first paint. Marked aria-hidden because it carries no meaning.
 */

/** Small deterministic PRNG — a linear congruential generator. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

interface NetworkGraphProps {
  /** How many nodes to scatter. */
  nodes?: number;
  className?: string;
}

export function NetworkGraph({ nodes = 26, className }: NetworkGraphProps) {
  const random = seeded(20260909);

  const points = Array.from({ length: nodes }, (_, index) => ({
    id: index,
    x: random() * 100,
    y: random() * 100,
    r: 0.45 + random() * 0.75,
    delay: random() * 3.6,
  }));

  // Link every node to its two nearest neighbours. Nearest-neighbour rather
  // than a distance threshold keeps the mesh evenly connected wherever the
  // scatter happens to be sparse, and caps the link count at a predictable
  // 2n so the animation never gets expensive.
  const links: { key: string; x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
  const seen = new Set<string>();

  for (const point of points) {
    const nearest = points
      .filter((other) => other.id !== point.id)
      .map((other) => ({
        other,
        distance: (other.x - point.x) ** 2 + (other.y - point.y) ** 2,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    for (const { other } of nearest) {
      const key = [point.id, other.id].sort((a, b) => a - b).join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        key,
        x1: point.x,
        y1: point.y,
        x2: other.x,
        y2: other.y,
        delay: Math.min(point.id, other.id) * 0.06,
      });
    }
  }

  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {links.map((link) => (
        <line
          key={link.key}
          className="cv-net-link"
          x1={link.x1}
          y1={link.y1}
          x2={link.x2}
          y2={link.y2}
          style={{ animationDelay: `${link.delay}s` }}
        />
      ))}

      {points.map((point) => (
        <g key={point.id}>
          {/* The halo is the outward ping; the node itself only breathes. */}
          <circle
            className="cv-net-halo"
            cx={point.x}
            cy={point.y}
            r={point.r}
            style={{ animationDelay: `${point.delay}s` }}
          />
          <circle
            className="cv-net-node"
            cx={point.x}
            cy={point.y}
            r={point.r}
            style={{ animationDelay: `${point.delay}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

export default NetworkGraph;
