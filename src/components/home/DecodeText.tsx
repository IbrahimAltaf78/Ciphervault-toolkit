"use client";

import { useEffect, useRef } from "react";

/**
 * Resolves text out of noise, one character at a time.
 *
 * The signature animation for a tool whose whole job is turning ciphertext back
 * into plaintext — the headline performs the thing the product does rather than
 * decorating it.
 *
 * Three details make it safe rather than showy:
 *
 *  - The final text is what renders on the server and on the first client
 *    paint. Nothing is hidden waiting for JavaScript, so the headline is
 *    readable with JS disabled, in a screenshot, and to a crawler.
 *  - The scramble mutates `textContent` through a ref inside
 *    requestAnimationFrame. It never touches React state, so it cannot trigger
 *    a re-render per frame or cause a hydration mismatch.
 *  - `prefers-reduced-motion` skips it entirely.
 */

/** Glyphs the noise is drawn from — binary and hex, matching the backdrop. */
const NOISE = "01x9af3c7e2d5b8";

interface DecodeTextProps {
  text: string;
  className?: string;
  /** Milliseconds before the resolve begins. */
  delay?: number;
  /** Milliseconds per character before it settles. */
  speed?: number;
}

export function DecodeText({
  text,
  className,
  delay = 420,
  speed = 34,
}: DecodeTextProps) {
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = node.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let raf = 0;
    let timer = 0;

    function tick() {
      // Characters settle left to right; everything past the front is noise.
      const settled = Math.floor(frame / (speed / 16));
      let out = "";

      for (let i = 0; i < text.length; i += 1) {
        if (i < settled || text[i] === " ") {
          out += text[i];
        } else {
          out += NOISE[Math.floor(Math.random() * NOISE.length)];
        }
      }

      element!.textContent = out;
      frame += 1;

      if (settled <= text.length) {
        raf = requestAnimationFrame(tick);
      } else {
        element!.textContent = text;
      }
    }

    // Start scrambled only once the timer fires, so the readable text is what
    // sits on screen until the animation actually begins.
    timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      // Whatever happened, leave the real text behind.
      if (element) element.textContent = text;
    };
  }, [text, delay, speed]);

  return (
    <span ref={node} className={className}>
      {text}
    </span>
  );
}

export default DecodeText;
