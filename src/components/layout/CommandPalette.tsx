"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { searchCommands, type Command } from "@/lib/commands";

/**
 * Command palette.
 *
 * With thirty-odd tools behind six hubs, reaching one takes two or three
 * navigations. This takes one keystroke — and a command line is the right
 * control for an app that already looks like a terminal.
 *
 * Opened with Ctrl+K, or Cmd+K on a Mac. Escape closes, arrows move, Enter
 * navigates.
 */
export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => searchCommands(query), [query]);

  // Global shortcut. Bound to the window rather than a field so it works
  // wherever the user happens to be on the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // The page behind must not scroll while the overlay is up.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setQuery("");
    setActive(0);
  }

  function choose(command: Command) {
    close();
    router.push(command.href);
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      choose(results[active]);
    }
  }

  let lastGroup = "";

  return (
    <>
      {/* The trigger stays mounted while the overlay is up. Swapping one for
          the other pulled the field out of the navbar and collapsed the bar
          behind the overlay, which the eye catches on the way back. */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Search tools"
        aria-expanded={isOpen}
        aria-keyshortcuts="Control+K"
        className="group flex w-full items-center gap-2.5 rounded-md border border-phos-line bg-phos-deep/60 px-3 py-2 text-left transition-colors hover:border-phos sm:w-72"
      >
        <Search
          aria-hidden
          className="size-4 shrink-0 text-phos-dim transition-colors group-hover:text-phos"
        />
        <span className="flex-1 truncate font-mono text-xs text-phos-dim">
          Search 35 tools...
        </span>
        <kbd className="hidden shrink-0 rounded border border-phos-line px-1.5 py-0.5 font-mono text-[10px] text-phos-dim sm:block">
          Ctrl K
        </kbd>
      </button>

      {!isOpen ? null : (
        <div
          /* A press anywhere on the screen dismisses — the backdrop, the panel,
             the field, all of it. Nothing stops the event on its way up.

             Bound to pointerdown rather than click for two reasons: a press
             that starts here still closes even if the pointer drifts before
             release, and the result rows can then act on the same event. On
             click they never would — the press closes the dialog, the row
             unmounts, and the click lands on nothing. */
          className="fixed inset-0 z-50 flex items-start justify-center bg-phos-void/80 p-4 pt-[12vh] backdrop-blur-sm"
          onPointerDown={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Jump to a tool"
            className="phos-card phos-rise w-full max-w-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-phos-line px-4">
              <Search aria-hidden className="size-4 shrink-0 text-phos" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onListKeyDown}
                placeholder="Jump to a tool..."
                aria-label="Search tools"
                aria-controls="command-results"
                className="w-full bg-transparent py-3.5 font-mono text-sm text-phos-white outline-none placeholder:text-phos-dim"
              />
              <kbd className="shrink-0 rounded border border-phos-line px-1.5 py-0.5 font-mono text-[10px] text-phos-dim">
                ESC
              </kbd>
            </div>

            <ul
              id="command-results"
              ref={listRef}
              role="listbox"
              className="max-h-[52vh] overflow-y-auto p-2"
            >
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-phos-dim">
                  Nothing matches “{query}”.
                </li>
              )}

              {results.map((command, index) => {
                // Group headings appear only when the group changes, so a filtered
                // list does not repeat one heading per row.
                const heading = command.group !== lastGroup ? command.group : null;
                lastGroup = command.group;

                return (
                  <li key={command.href}>
                    {heading && (
                      <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-phos-dim">
                        {heading}
                      </p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onPointerDown={() => choose(command)}
                      className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition-colors ${
                        index === active
                          ? "bg-phos/12 text-phos-hot"
                          : "text-phos-dim hover:text-phos-white"
                      }`}
                    >
                      <span className="flex-1 truncate">{command.label}</span>
                      {index === active && (
                        <CornerDownLeft aria-hidden className="phos-pop size-3.5 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-4 border-t border-phos-line px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-phos-dim">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>click anywhere or esc</span>
              <span className="ml-auto">{results.length} tools</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CommandPalette;
