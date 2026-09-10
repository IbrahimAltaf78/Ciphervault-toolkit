"use client";

import { useEffect, useRef } from "react";

export type DigitFlowProps = {
  /** Glyph colour. */
  color?: string;
  /** Ground the trails fade into. */
  background?: string;
  /** Global speed multiplier. */
  speed?: number;
  /** How far a glyph fades before the next frame paints over it — the trail
   *  length. Higher dims faster, so streaks are shorter. */
  idleDim?: number;
  /** How hard the flow field bends a particle's heading. */
  flowStrength?: number;
  /** Number of glyphs on screen. */
  particleCount?: number;
  /** Occasional cyan / magenta glyphs among the white. */
  colorfulSparks?: boolean;
  /** Amplitude of the side-to-side weave that makes the streams snake. */
  snakeAmplitude?: number;
  className?: string;
};

/** The alphabet. Digits only: this sits behind a toolkit about bits. */
const GLYPHS = "0123456789";

/** Spark hues, used sparingly so the field stays near-monochrome. */
const SPARKS = ["#7dd3fc", "#e879f9", "#a78bfa"];

/**
 * Drifting glyph flow field.
 *
 * Particles ride a smooth vector field and each frame paints its digit at the
 * new position. The canvas is never fully cleared — it is washed with a
 * low-alpha rectangle of the background colour instead, so old frames decay
 * rather than vanish and every particle leaves a motion-blurred streak. That
 * wash is the whole effect; clearing properly would give hard dots.
 *
 * The field itself is a pair of offset sines rather than true Perlin noise:
 * cheap, tileable, and at this scale indistinguishable, while keeping the
 * component dependency-free.
 *
 * Everything runs in a single rAF loop that stops when the element scrolls out
 * of view or the tab is hidden, and never starts under `prefers-reduced-motion`
 * — a full-screen animated field is exactly what that setting is for. In that
 * case one static frame is painted so the panel is not simply black.
 */
export function DigitFlow({
  color = "#EBEEFF",
  background = "#000000",
  speed = 0.4,
  idleDim = 0.6,
  flowStrength = 0.5,
  particleCount = 750,
  colorfulSparks = true,
  snakeAmplitude = 0.5,
  className,
}: DigitFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live values for the loop, so a prop change does not restart the field.
  const settings = useRef({
    color,
    background,
    speed,
    idleDim,
    flowStrength,
    particleCount,
    colorfulSparks,
    snakeAmplitude,
  });

  // Synced in an effect, not during render: the loop reads the latest props
  // through this ref, and writing a ref while rendering breaks React's rules
  // of refs.
  useEffect(() => {
    settings.current = {
      color,
      background,
      speed,
      idleDim,
      flowStrength,
      particleCount,
      colorfulSparks,
      snakeAmplitude,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      char: string;
      size: number;
      spark: string | null;
      phase: number;
    };

    const particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let time = 0;

    function makeParticle(): Particle {
      const isSpark = settings.current.colorfulSparks && Math.random() < 0.06;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        char: GLYPHS[(Math.random() * GLYPHS.length) | 0],
        size: 8 + Math.random() * 9,
        spark: isSpark ? SPARKS[(Math.random() * SPARKS.length) | 0] : null,
        phase: Math.random() * Math.PI * 2,
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      // Cap the backing store at 2x. Beyond that the fill cost of the wash
      // rectangle dominates and the field stutters on laptop GPUs.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = settings.current.background;
      ctx!.fillRect(0, 0, width, height);
    }

    function sync() {
      const target = Math.max(0, Math.round(settings.current.particleCount));
      while (particles.length < target) particles.push(makeParticle());
      if (particles.length > target) particles.length = target;
    }

    /** Heading of the field at a point, in radians. */
    function fieldAngle(x: number, y: number, t: number) {
      const s = settings.current;
      const scale = 0.0022;
      const weave =
        Math.sin(y * scale * 2.1 + t * 0.6) * s.snakeAmplitude * 1.6 +
        Math.cos(x * scale * 1.4 - t * 0.4) * s.snakeAmplitude;
      // Base heading points right; the field bends it up and down. Keeping a
      // rightward bias is what makes the streams read as flowing rather than
      // milling about.
      return weave * s.flowStrength * 1.4;
    }

    function step() {
      const s = settings.current;
      time += 0.006 * Math.max(0.05, s.speed);

      // The wash. Alpha is what sets streak length: a small value leaves long
      // smears, a large one nearly clears the frame. Kept low — the comet
      // trails are the effect, and at 0.1 the glyphs read as loose confetti.
      ctx!.globalAlpha = 0.012 + s.idleDim * 0.05;
      ctx!.fillStyle = s.background;
      ctx!.fillRect(0, 0, width, height);
      ctx!.globalAlpha = 1;

      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      for (const p of particles) {
        const angle = fieldAngle(p.x, p.y, time + p.phase * 0.08);
        // Bigger glyphs travel faster, which reads as depth: the near ones
        // streak past while the small ones drift at the back.
        const velocity = (0.7 + p.size * 0.09) * s.speed * 4.4;

        p.vx = Math.cos(angle) * velocity;
        p.vy = Math.sin(angle) * velocity;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap. Re-entering on the far side keeps density even without
        // respawning, which would make the field pulse.
        if (p.x > width + 20) p.x = -20;
        else if (p.x < -20) p.x = width + 20;
        if (p.y > height + 20) p.y = -20;
        else if (p.y < -20) p.y = height + 20;

        // Occasionally roll a new digit, so the field reads as data rather
        // than as a fixed set of drifting characters.
        if (Math.random() < 0.012) {
          p.char = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }

        ctx!.font = `${p.size.toFixed(1)}px ui-monospace, "JetBrains Mono", monospace`;
        ctx!.fillStyle = p.spark ?? s.color;
        ctx!.globalAlpha = p.spark ? 0.85 : 0.14 + (p.size / 17) * 0.5;
        ctx!.fillText(p.char, p.x, p.y);
      }

      ctx!.globalAlpha = 1;
    }

    function loop() {
      if (!running) return;
      sync();
      step();
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      frame = window.requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
    }

    resize();
    sync();

    if (reduceMotion) {
      // One static frame: the same field, held still.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of particles) {
        ctx.font = `${p.size.toFixed(1)}px ui-monospace, monospace`;
        ctx.fillStyle = p.spark ?? settings.current.color;
        ctx.globalAlpha = p.spark ? 0.7 : 0.18;
        ctx.fillText(p.char, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      sync();
    });
    resizeObserver.observe(canvas);

    // Stop when off-screen or the tab is hidden — a full-screen rAF loop is
    // not something to leave burning in a background tab.
    const intersection = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    intersection.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%", background }}
    />
  );
}

export default DigitFlow;
