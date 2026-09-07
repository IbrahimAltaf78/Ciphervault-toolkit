/**
 * Route transition.
 *
 * A template remounts on every navigation where a layout would not, so the
 * entrance animation replays each time the route changes. That is the whole
 * trick: no experimental View Transitions API, no router events, no client
 * component — just a file in the right place.
 *
 * Without it the power-on sequence only ever ran on a cold load, and moving
 * between tools felt like content swapping inside a static frame.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="phos-enter">{children}</div>;
}
