/**
 * Isometric wireframe lattice for the hero.
 *
 * Drawn rather than illustrated: a cube of nested frames on an isometric
 * projection, which reads as "structure inside structure" — the thing every
 * module here does to a file. Decorative, so it is hidden from assistive
 * technology.
 *
 * Pure SVG with no external asset, so it inherits the phosphor colour and stays
 * sharp at any size.
 */

/** Isometric projection: x runs 30 degrees right, y 30 degrees left, z is up. */
function project(x: number, y: number, z: number): [number, number] {
  const COS30 = Math.cos(Math.PI / 6);
  const SIN30 = Math.sin(Math.PI / 6);
  return [(x - y) * COS30, (x + y) * SIN30 - z];
}

/** The twelve edges of a cube, as index pairs into its eight corners. */
const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function cubeCorners(size: number): Array<[number, number]> {
  const s = size;
  return [
    project(0, 0, 0), project(s, 0, 0), project(s, s, 0), project(0, s, 0),
    project(0, 0, s), project(s, 0, s), project(s, s, s), project(0, s, s),
  ];
}

export function WireCube({ className }: { className?: string }) {
  // Nested shells, each fainter than the one outside it.
  const shells = [
    { size: 100, opacity: 0.9, width: 1.1 },
    { size: 72, opacity: 0.55, width: 0.9 },
    { size: 44, opacity: 0.32, width: 0.8 },
    { size: 18, opacity: 0.9, width: 1.4 },
  ];

  return (
    <svg
      aria-hidden
      viewBox="-100 -130 200 240"
      className={className}
      fill="none"
      stroke="currentColor"
    >
      {/* Ground grid, fading out from the cube. */}
      <g opacity="0.18" strokeWidth="0.5">
        {Array.from({ length: 11 }, (_, i) => {
          const t = -100 + i * 20;
          const [ax, ay] = project(t, -100, 0);
          const [bx, by] = project(t, 100, 0);
          const [cx, cy] = project(-100, t, 0);
          const [dx, dy] = project(100, t, 0);
          return (
            <g key={t}>
              <line x1={ax} y1={ay} x2={bx} y2={by} />
              <line x1={cx} y1={cy} x2={dx} y2={dy} />
            </g>
          );
        })}
      </g>

      {shells.map((shell) => {
        const corners = cubeCorners(shell.size);
        // Centre each shell on the same point so they nest concentrically.
        const offset = (100 - shell.size) / 2;
        const [ox, oy] = project(offset, offset, offset);

        return (
          <g
            key={shell.size}
            opacity={shell.opacity}
            strokeWidth={shell.width}
            transform={`translate(${ox} ${oy})`}
          >
            {EDGES.map(([from, to]) => (
              <line
                key={`${from}-${to}`}
                x1={corners[from][0]}
                y1={corners[from][1]}
                x2={corners[to][0]}
                y2={corners[to][1]}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default WireCube;
