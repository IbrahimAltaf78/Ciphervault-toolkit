import { CircuitBoard, EyeOff, ServerOff } from "lucide-react";

/**
 * Three properties, one line each.
 *
 * The page ran hero, module grid, and stopped. The grid answers what is here;
 * nothing answered whether it can be trusted with real data, which is the
 * question a visitor to a cryptography tool arrives with.
 *
 * Kept to a single line per point on purpose. This is reassurance, not
 * documentation — a paragraph here competes with the module cards above it for
 * attention it does not need.
 */
const ASSURANCES = [
  {
    icon: CircuitBoard,
    title: "Runs in your browser",
    body: "Encryption and encoding never leave this page.",
  },
  {
    icon: ServerOff,
    title: "Nothing is stored",
    body: "No database, no session, no analytics.",
  },
  {
    icon: EyeOff,
    title: "Keys never leave",
    body: "PBKDF2-stretched and marked non-extractable.",
  },
] as const;

export function Assurances() {
  return (
    <section aria-label="Security properties">
      <ul className="grid gap-x-8 gap-y-4 border-t border-phos-line pt-6 sm:grid-cols-3">
        {ASSURANCES.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <item.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-phos" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold text-phos-white">{item.title}</span>
              <span className="text-phos-dim"> &mdash; {item.body}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Assurances;
