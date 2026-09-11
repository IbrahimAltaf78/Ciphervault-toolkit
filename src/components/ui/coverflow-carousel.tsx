"use client";

/**
 * Coverflow carousel — adapted from ruixen.ui's "Coverflow Carousel" on
 * 21st.dev (https://21st.dev/@ruixen.ui/components/coverflow-carousel).
 *
 * Kept from the original: the perspective rack, the eased falloff that keeps
 * neighbours readable, and painting transforms straight onto the DOM instead
 * of through React state.
 *
 * Two layouts:
 *   - "slide" (the original): the rack slides so the selected card is always
 *     centred.
 *   - "fan": the rack stays put, every card in its own fixed slot, and only
 *     the focus travels — the focused card turns square to the viewer, lifts
 *     forward and grows, and its neighbours angle away from it. Built for a
 *     short set that must all be visible at once: in "slide", centring the
 *     first card piles every other card up on one side, and their titles
 *     collide.
 *
 * Changed for CipherVault:
 *   - No drag. With a mouse, resting on a card brings it to the front and a
 *     click opens it. On touch, the first tap brings a card forward and the
 *     second opens it. Arrow keys, Tab focus and the side buttons step.
 *   - The stage ignores the pointer and the cards take it. Cards pushed back
 *     in Z sit behind the stage's own box, which otherwise swallowed every
 *     hit — a real mouse could reach only the centre card.
 *   - `initialIndex` + `onSelect` let a caller restore and persist the
 *     selection across navigations.
 *   - Cards take arbitrary content; no `cn` / `tailwindcss-animate`.
 *   - The first frame is laid out in CSS from `--cf-card`, so the server
 *     render is already the finished rack rather than a stack that jumps.
 *   - Reduced motion jumps straight to the target instead of easing.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export interface CoverflowSlide {
  id: string;
  title: string;
  subtitle?: string;
  /** Where the card goes when opened. */
  href?: string;
  /** The card face. */
  face: React.ReactNode;
}

export interface CoverflowCarouselProps {
  slides: CoverflowSlide[];
  /** "slide" centres the selection; "fan" keeps slots fixed and moves focus. */
  layout?: "slide" | "fan";
  /** Degrees the first neighbour tilts. */
  rotate?: number;
  /** Rotation never exceeds this, so a far card stays readable. */
  maxTilt?: number;
  /** How far the first neighbour recedes, as a fraction of card width. */
  depth?: number;
  /** Fan only: how far the focused card lifts toward the viewer. */
  lift?: number;
  /** Fan only: extra scale on the focused card. */
  pop?: number;
  /** Viewer distance as a multiple of card width — smaller is a wider lens. */
  perspective?: number;
  /** Exponent on distance. Below 1 the rake eases off as cards travel out. */
  falloff?: number;
  /** Opacity lost per step from the focus. */
  fade?: number;
  /** Any CSS length. Everything else is derived from it, so the rack scales. */
  cardWidth?: string;
  /** Space between cards, as a fraction of card width. */
  gap?: number;
  loop?: boolean;
  /** Card focused on first render. */
  initialIndex?: number;
  /** Called whenever a card becomes (or is opened as) the selection. */
  onSelect?: (index: number) => void;
  /** Resting the mouse on a card brings it to the front. */
  hoverToFocus?: boolean;
  /** How long the pointer must rest on a card before it moves, in ms. */
  hoverDelay?: number;
  showCaption?: boolean;
  showNavigation?: boolean;
  /** Text on the caption's link to the focused slide. */
  openLabel?: string;
  /** Names the carousel for assistive tech. */
  label?: string;
  className?: string;
}

/** Offset of a card from the focus, folded the short way round a ring. */
function foldOffset(index: number, pos: number, count: number, loop: boolean) {
  let offset = index - pos;
  if (loop) {
    offset = ((offset % count) + count) % count;
    if (offset > count / 2) offset -= count;
  }
  return offset;
}

export function CoverflowCarousel({
  slides,
  layout = "slide",
  rotate = 44,
  maxTilt = 82,
  depth = 0.6,
  lift = 0.22,
  pop = 0.1,
  perspective = 3,
  falloff = 0.56,
  fade = 0.12,
  cardWidth = "clamp(170px, 24vw, 280px)",
  gap = 0.06,
  loop = true,
  initialIndex = 0,
  onSelect,
  hoverToFocus = false,
  hoverDelay = 140,
  showCaption = true,
  showNavigation = true,
  openLabel = "Open",
  label = "Cover carousel",
  className,
}: CoverflowCarouselProps) {
  const count = slides.length;
  const router = useRouter();
  const fan = layout === "fan";
  // A fan has fixed slots, so there is no ring to wrap round.
  const wraps = loop && !fan;
  const start = Math.max(0, Math.min(count - 1, Math.round(initialIndex)));

  const frameRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  /** Fractional focus index — the single source of truth. */
  const posRef = React.useRef(start);
  /** Where the current settle is headed. */
  const targetRef = React.useRef(start);
  const widthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  /** Pending hover-to-front: which card, and the timer that will move it. */
  const hoverRef = React.useRef<{ index: number; timer: number } | null>(null);
  /** How the last press arrived — decides what a click on a side card does. */
  const pointerTypeRef = React.useRef("mouse");
  /** Where the mouse last was, to tell a real move from a re-hit-test. */
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);

  const [selected, setSelected] = React.useState(start);

  const indexAt = React.useCallback(
    (pos: number) => ((Math.round(pos) % count) + count) % count,
    [count],
  );

  /**
   * Geometry of one card, as unit-free numbers the caller scales by the card
   * width: horizontal position in pitches, depth in widths, and the rest.
   */
  const geometry = React.useCallback(
    (index: number, pos: number) => {
      const offset = foldOffset(index, pos, count, wraps);
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      const tilt = Math.min(rotate * ramp, maxTilt) * Math.sign(offset);
      // 1 at the focus, 0 from one step out: drives the lift and the pop.
      const near = Math.max(0, 1 - distance);
      const edge = wraps ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      return {
        // Fan: every card keeps its own slot, centred on the middle of the set.
        // Slide: cards sit where their offset from the focus puts them.
        slot: fan ? index - (count - 1) / 2 : offset,
        z: -depth * ramp + (fan ? lift * near : 0),
        tilt,
        scale: fan ? 1 + pop * near : 1,
        opacity: Math.max(fan ? 0.55 : 0.28, 1 - fade * distance) * edge,
        layer: 100 - Math.round(distance),
      };
    },
    [count, depth, falloff, fade, fan, lift, maxTilt, pop, rotate, wraps],
  );

  // Paint straight to the DOM: sixty state updates a second would re-render
  // every card for numbers React never needs to see.
  const paint = React.useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * (1 + gap);
    const pos = posRef.current;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const g = geometry(index, pos);
      card.style.transform =
        `translateX(calc(-50% + ${g.slot * pitch}px)) ` +
        `translateZ(${g.z * width}px) rotateY(${-g.tilt}deg) scale(${g.scale})`;
      card.style.opacity = String(g.opacity);
      card.style.zIndex = String(g.layer);
    });
  }, [gap, geometry]);

  const settle = React.useCallback(
    (target: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      targetRef.current = target;
      const index = indexAt(target);
      setSelected(index);
      onSelect?.(index);

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        posRef.current = target;
        paint();
        rafRef.current = null;
        return;
      }

      const step = () => {
        const remaining = target - posRef.current;
        if (Math.abs(remaining) < 0.0004) {
          posRef.current = target;
          paint();
          rafRef.current = null;
          return;
        }
        // Exponential ease-out: quick to leave, soft to land, no overshoot.
        posRef.current += remaining * 0.16;
        paint();
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [indexAt, onSelect, paint],
  );

  const clampPos = React.useCallback(
    (pos: number) => (wraps ? pos : Math.max(0, Math.min(count - 1, pos))),
    [count, wraps],
  );

  const goTo = React.useCallback(
    (index: number) => {
      // Take the shorter way round rather than unwinding the whole ring.
      const target = wraps
        ? index + Math.round((targetRef.current - index) / count) * count
        : index;
      settle(clampPos(target));
    },
    [clampPos, count, settle, wraps],
  );

  const nudge = React.useCallback(
    (by: number) => settle(clampPos(Math.round(targetRef.current) + by)),
    [clampPos, settle],
  );

  const open = React.useCallback(
    (index: number) => {
      const href = slides[index]?.href;
      if (!href) return;
      // Recorded before leaving, so coming back lands on this card.
      onSelect?.(index);
      router.push(href);
    },
    [onSelect, router, slides],
  );

  const clearHover = React.useCallback(() => {
    if (hoverRef.current) {
      window.clearTimeout(hoverRef.current.timer);
      hoverRef.current = null;
    }
  }, []);

  const onCardPointerMove = (event: React.PointerEvent, index: number) => {
    if (!hoverToFocus || event.pointerType !== "mouse") return;
    // A move at the same position as the last one is the browser re-hit-
    // testing because the cards changed under a resting cursor. Acting on it
    // could chain: each card that arrives under the cursor pulling the next.
    // Compared by position rather than `movementX`, which is zero for some
    // genuine moves too (injected input, coalesced sub-pixel moves).
    const last = lastPointRef.current;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    if (last && Math.abs(event.clientX - last.x) + Math.abs(event.clientY - last.y) < 1) return;

    if (index === indexAt(targetRef.current)) {
      clearHover();
      return;
    }
    if (hoverRef.current?.index === index) return;
    clearHover();
    // A short dwell, so sweeping the mouse across the rack does not drag the
    // focus along card by card.
    hoverRef.current = {
      index,
      timer: window.setTimeout(() => {
        hoverRef.current = null;
        goTo(index);
      }, hoverDelay),
    };
  };

  // Card width drives pitch, depth and perspective, so it is the only thing
  // worth measuring — and only when the box actually changes.
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      widthRef.current = card.offsetWidth;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearHover();
    },
    [clearHover],
  );

  const active = slides[selected];
  const atStart = !wraps && selected === 0;
  const atEnd = !wraps && selected === count - 1;

  return (
    <div
      className={className}
      style={{ width: "100%", ["--cf-card" as string]: cardWidth }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative">
        <div
          ref={frameRef}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(1);
            }
          }}
          // Vertical padding keeps shadows and the lifted card clear of the
          // clip. A fan scrolls sideways on screens too narrow for every slot.
          className={fan ? "overflow-x-auto overflow-y-hidden py-14" : "overflow-hidden py-12"}
          style={{ perspective: `calc(var(--cf-card) * ${perspective})` }}
        >
          {/* pointer-events: none on the stage, auto on the cards. Cards
              pushed back in Z sit behind this box, and without this it
              intercepts every hit — a real mouse could neither hover nor
              click any card except the centre one. */}
          <div
            className="pointer-events-none relative mx-auto"
            style={{
              height: "var(--cf-card)",
              transformStyle: "preserve-3d",
              // A fan's slots need their full span; on a narrow screen this
              // makes the frame scroll rather than clipping the end cards.
              minWidth: fan
                ? `calc(var(--cf-card) * ${count + (count - 1) * gap} + 3rem)`
                : undefined,
            }}
          >
            {slides.map((slide, index) => {
              const g = geometry(index, start);
              const isActive = index === selected;
              return (
                <button
                  key={slide.id}
                  type="button"
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  data-active={isActive ? "true" : undefined}
                  aria-label={isActive ? `${openLabel} ${slide.title}` : `Show ${slide.title}`}
                  aria-current={isActive ? "true" : undefined}
                  onPointerDown={(event) => {
                    pointerTypeRef.current = event.pointerType;
                  }}
                  onPointerMove={(event) => onCardPointerMove(event, index)}
                  onPointerLeave={() => {
                    if (hoverRef.current?.index === index) clearHover();
                  }}
                  onClick={() => {
                    clearHover();
                    // A mouse has already previewed by hovering, so a click
                    // means "open". Touch has no hover: its first tap brings
                    // the card forward and only the second opens it.
                    if (isActive || pointerTypeRef.current === "mouse") open(index);
                    else goTo(index);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (isActive) open(index);
                      else goTo(index);
                    }
                  }}
                  onFocus={(event) => {
                    // Tabbing onto a card brings it forward, so keyboard users
                    // see what they are on. Mouse focus is left alone.
                    if (!isActive && event.currentTarget.matches(":focus-visible")) goTo(index);
                  }}
                  className="cv-cover pointer-events-auto absolute left-1/2 top-0 aspect-square will-change-transform"
                  style={{
                    width: "var(--cf-card)",
                    // The same rack the paint loop draws, expressed in CSS
                    // so the server-rendered frame is already correct.
                    transform:
                      `translateX(calc(-50% + ${g.slot * (1 + gap)} * var(--cf-card))) ` +
                      `translateZ(calc(${g.z} * var(--cf-card))) rotateY(${-g.tilt}deg) scale(${g.scale})`,
                    opacity: g.opacity,
                    zIndex: g.layer,
                  }}
                >
                  {slide.face}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slide keeps its arrows on the flanks. A fan puts them beside the
            caption instead: its end slots are occupied, and the focused end
            card lifts forward right under where a flank arrow would sit. */}
        {showNavigation && !fan && (
          <>
            <button
              type="button"
              aria-label="Previous"
              disabled={atStart}
              onClick={() => nudge(-1)}
              className="cv-nub absolute left-2 top-1/2 z-[200] -translate-y-1/2 bg-phos-void/70 backdrop-blur-sm"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={atEnd}
              onClick={() => nudge(1)}
              className="cv-nub absolute right-2 top-1/2 z-[200] -translate-y-1/2 bg-phos-void/70 backdrop-blur-sm"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </>
        )}
      </div>

      {showCaption && active && (
        // cv-scrim: the caption sits over whatever animated ground the page
        // has, so it gets the same dark pool as a page header.
        <div className="cv-scrim mt-1 flex items-start justify-center gap-4 sm:gap-8">
          {showNavigation && fan && (
            <button
              type="button"
              aria-label="Previous"
              disabled={atStart}
              onClick={() => nudge(-1)}
              className="cv-nub mt-1 shrink-0"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
          )}
        {/* Keyed on the selection so the caption re-runs its entrance each
            time focus lands on a new card. */}
        <div key={active.id} className="cv-caption-in flex min-w-0 flex-col items-center px-2 text-center sm:min-w-[18rem]">
          <p className="text-lg font-bold tracking-tight text-phos-white">{active.title}</p>
          {active.subtitle && (
            <p className="mt-1 max-w-md text-sm text-muted">{active.subtitle}</p>
          )}
          {active.href && (
            <Link
              href={active.href}
              onClick={() => onSelect?.(selected)}
              className="cv-btn mt-5"
            >
              {openLabel} {active.title} →
            </Link>
          )}
        </div>
          {showNavigation && fan && (
            <button
              type="button"
              aria-label="Next"
              disabled={atEnd}
              onClick={() => nudge(1)}
              className="cv-nub mt-1 shrink-0"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CoverflowCarousel;
