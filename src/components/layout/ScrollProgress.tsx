"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll position, as a hairline across the top edge.
 *
 * On the long tool pages — a cryptography panel with its explainer open runs
 * well past a screen — this is the only signal of how much is left.
 *
 * The width is written straight to the element inside requestAnimationFrame.
 * Driving it through React state would re-render the tree on every scroll
 * frame, which is exactly the pattern that makes a page feel heavy.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    function update() {
      raf = 0;
      const element = bar.current;
      if (!element) return;

      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      // A page that does not scroll has no progress to report.
      if (scrollable <= 0) {
        element.style.width = "0%";
        return;
      }

      const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
      element.style.width = `${ratio * 100}%`;
    }

    function onScroll() {
      // Coalesce bursts of scroll events into one write per frame.
      if (!raf) raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={bar} aria-hidden className="phos-progress" />;
}

export default ScrollProgress;
