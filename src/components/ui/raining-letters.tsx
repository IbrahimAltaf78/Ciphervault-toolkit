"use client";

import { useEffect, useRef } from "react";

export type RainingLettersProps = {
  /** How many glyphs are in the air. */
  count?: number;
  /** Colour of the lit glyphs. Matches the cover page particles. */
  accent?: string;
  /** Colour of the resting glyphs. */
  dim?: string;
  /** Global fall-speed multiplier. */
  speed?: number;
  className?: string;
};

const GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~";

type Letter = {
  char: string;
  /** Percent across the viewport. */
  x: number;
  /** Percent down the viewport. */
  y: number;
  speed: number;
  size: number;
  active: boolean;
};

/**
 * Falling glyph field.
 *
 * Characters descend and loop, and a small share are "active" at any moment —
 * brighter, bolder, glowing — while the rest sit back dim. The contrast
 * between the two is the effect; a field where every glyph is equally bright
 * reads as noise.
 *
 * Loose glyphs on purpose. A column-and-trail version was tried and pulled:
 * it read as a wall of Matrix rain and buried the tiles instead of sitting
 * behind them.
 *
 * No state and no randomness during render. The markup is identical on the
 * server and the client — every span starts at the origin — and the effect
 * then scatters them by writing `transform` straight onto the nodes. That
 * keeps hydration exact, avoids a setState-in-effect cascade, and means the
 * ~200 nodes are never re-rendered by React while the field is running.
 *
 * The loop stops when the tab is hidden and never starts under
 * `prefers-reduced-motion` — a full-screen field of moving text is exactly
 * what that setting exists to switch off; a still field renders instead.
 */
export function RainingLetters({
  count = 220,
  accent = "#60A5FA",
  dim = "#64748b",
  speed = 1,
  className,
}: RainingLettersProps) {
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const state = useRef<Letter[]>([]);
  const settings = useRef({ accent, dim, speed });

  // Synced in an effect rather than during render: the loop reads the latest
  // props through this ref, and writing a ref while rendering breaks React's
  // rules of refs.
  useEffect(() => {
    settings.current = { accent, dim, speed };
  });

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Scatter on mount. Spread down the screen so the field is already full
    // on arrival rather than trickling in from above.
    const seed: Letter[] = Array.from({ length: count }, () => ({
      char: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      x: Math.random() * 100,
      y: Math.random() * 120 - 20,
      speed: 0.06 + Math.random() * 0.34,
      size: 11 + Math.random() * 10,
      active: Math.random() < 0.16,
    }));
    state.current = seed;

    const paint = (index: number) => {
      const letter = seed[index];
      const node = nodes.current[index];
      if (!node) return;
      const s = settings.current;
      node.textContent = letter.char;
      node.style.fontSize = `${letter.size.toFixed(1)}px`;
      node.style.transform = `translate3d(${letter.x}vw, ${letter.y}vh, 0)`;
      node.style.color = letter.active ? s.accent : s.dim;
      node.style.opacity = letter.active ? "1" : "0.32";
      node.style.fontWeight = letter.active ? "700" : "400";
      node.style.textShadow = letter.active
        ? `0 0 8px ${s.accent}, 0 0 18px ${s.accent}`
        : "none";
    };

    for (let i = 0; i < seed.length; i += 1) paint(i);

    if (reduceMotion) return;

    let frame = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      const s = settings.current;

      for (let i = 0; i < state.current.length; i += 1) {
        const letter = state.current[i];
        const node = nodes.current[i];
        if (!node) continue;

        letter.y += letter.speed * s.speed;

        // Loop back above the top edge in a new column with a new glyph, so
        // the field never settles into recognisable repeating streams.
        if (letter.y > 108) {
          letter.y = -8;
          letter.x = Math.random() * 100;
          letter.char = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          node.textContent = letter.char;
        }

        // Glyphs flicker between characters as they fall.
        if (Math.random() < 0.008) {
          letter.char = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          node.textContent = letter.char;
        }

        // A glyph lights up or goes back to rest. Kept rare, so the lit ones
        // stay events rather than becoming the baseline.
        if (Math.random() < 0.004) {
          letter.active = !letter.active;
          if (letter.active) {
            node.style.color = s.accent;
            node.style.opacity = "1";
            node.style.fontWeight = "700";
            node.style.textShadow = `0 0 8px ${s.accent}, 0 0 18px ${s.accent}`;
          } else {
            node.style.color = s.dim;
            node.style.opacity = "0.32";
            node.style.fontWeight = "400";
            node.style.textShadow = "none";
          }
        }

        node.style.transform = `translate3d(${letter.x}vw, ${letter.y}vh, 0)`;
      }

      frame = window.requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (frame) window.cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = window.requestAnimationFrame(tick);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    frame = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count]);

  return (
    <div
      aria-hidden
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            nodes.current[index] = node;
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            // Off-screen until the effect places it, so the un-scattered
            // first paint is never visible as a stack in the corner.
            transform: "translate3d(-50px, -50px, 0)",
            willChange: "transform",
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            fontSize: "13px",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
            color: dim,
            opacity: 0.32,
          }}
        />
      ))}
    </div>
  );
}

export default RainingLetters;
