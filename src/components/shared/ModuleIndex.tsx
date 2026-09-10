import Link from "next/link";
import type { ReactNode } from "react";

export interface IndexEntry {
  /** Tool name — the thing the reader is scanning for. */
  name: string;
  /** Alphabet, carrier, key size — whatever this family measures itself by. */
  meta?: string;
  href: string;
  /** Short status word: "recommended", "broken", "withdrawn". */
  status?: { text: string; tone?: "ok" | "warn" | "bad" };
}

interface ModuleIndexProps {
  eyebrow: string;
  title: string;
  /** One line. Anything longer belongs on the tool page itself. */
  lead?: string;
  /** The module's own animation, shown as a banner above the list. */
  fx?: ReactNode;
  groups: { label?: string; entries: IndexEntry[] }[];
  children?: ReactNode;
}

/** Status colouring stays off the theme hue: a broken cipher has to look
 *  broken on a page where everything else is blue. */
const TONE: Record<string, string> = {
  // Green, not the site blue. A bulk recolour folded this into the theme hue
  // once and it had to be undone: "recommended" and "broken" are states, and
  // a state never takes the decorative colour.
  ok: "border-emerald-900/70 text-emerald-400",
  warn: "border-amber-900/70 text-amber-400",
  bad: "border-red-900/70 text-red-400",
};

/**
 * The shell every module hub is built from.
 *
 * Deliberately short on words: a banner showing what the module does to data,
 * a title, one line, then the tools. Earlier passes carried a lead paragraph,
 * a spec table and a closing panel on every hub, and the pages read as
 * documentation rather than as an instrument.
 */
export function ModuleIndex({
  eyebrow,
  title,
  lead,
  fx,
  groups,
  children,
}: ModuleIndexProps) {
  // Numbering runs unbroken across groups, so the last tile is also the count
  // of everything the module holds. Derived rather than counted: a variable
  // reassigned inside a render callback is not stable across re-renders, so
  // each ordinal is computed from the sizes of the groups before it.
  const numbered = groups.map((group, groupIndex) => ({
    ...group,
    entries: group.entries.map((entry, entryIndex) => ({
      entry,
      ordinal:
        groups
          .slice(0, groupIndex)
          .reduce((sum, earlier) => sum + earlier.entries.length, 0) +
        entryIndex +
        1,
    })),
  }));

  return (
    <div className="phos-enter">
      {fx}

      <header className="phos-rise mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <div>
          <p className="cv-label accent-text">{eyebrow}</p>
          <h1 className="mt-2 max-w-3xl">{title}</h1>
        </div>
        {lead && <p className="max-w-sm text-sm text-muted">{lead}</p>}
      </header>

      {numbered.map((group, groupIndex) => (
        <section key={group.label ?? groupIndex} className="mt-10">
          {group.label && (
            <div className="flex items-baseline justify-between gap-4 border-b border-edge pb-2.5">
              <h2 className="cv-label !text-foreground">{group.label}</h2>
              <span className="cv-meta text-phos-edge">
                {String(group.entries.length).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.entries.map(({ entry, ordinal }) => {
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="cv-tile cv-reveal accent-ring"
                >
                  <span aria-hidden className="cv-ghost">
                    {String(ordinal).padStart(2, "0")}
                  </span>

                  {entry.status ? (
                    <span className={`cv-badge w-fit ${TONE[entry.status.tone ?? "ok"]}`}>
                      {entry.status.text}
                    </span>
                  ) : (
                    <span aria-hidden className="block h-1" />
                  )}

                  <span className="block">
                    <span className="cv-tile-name block">{entry.name}</span>
                    <span className="mt-3 flex items-center justify-between gap-4 border-t border-edge pt-2.5">
                      <span className="cv-tile-meta">{entry.meta ?? ""}</span>
                      <span className="cv-tile-go">Open →</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {children && <div className="mt-12">{children}</div>}
    </div>
  );
}

export default ModuleIndex;
