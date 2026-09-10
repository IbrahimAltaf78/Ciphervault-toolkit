"use client";

import { useEffect, useRef } from "react";

/**
 * One animation per module, each showing what that module actually does to
 * data rather than being generic decoration.
 *
 * All six share the site's blue (`--fx`), all six run on one canvas with a
 * single rAF loop, and all six stop when off-screen, when the tab is hidden,
 * or when the reader has asked for reduced motion — in which case a static
 * final frame is drawn so the panel is never just an empty box.
 */

const BLUE = "#60A5FA";
const DIM = "#3d4a5c";
const GROUND = "#07080a";

/** Shared canvas plumbing: DPR sizing, lifecycle, reduced-motion. */
function useCanvasLoop(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);

  // Kept current in an effect rather than during render. The loop reads the
  // latest draw function through this ref; writing to a ref while rendering
  // is what React's rules of refs forbid.
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let frame = 0;
    let tick = 0;
    let running = false;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const loop = () => {
      if (!running) return;
      tick += 1;
      drawRef.current(ctx, w, h, tick);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduce) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
    };

    resize();

    if (reduce) {
      // A frame far enough in that the figure reads as finished, held still.
      drawRef.current(ctx, w, h, 220);
      return;
    }

    const ro = new ResizeObserver(() => {
      resize();
      drawRef.current(ctx, w, h, tick);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return ref;
}

function Frame({ inner }: { inner: React.ReactNode }) {
  return (
    <div className="relative h-40 w-full overflow-hidden border border-edge bg-phos-deep sm:h-48">
      {inner}
    </div>
  );
}

/* ==========================================================================
   01 · Steganography — payload written into the low bits
   ========================================================================== */

/** A carrier grid with a write-head sweeping across it, lighting the cells it
 *  has already written a payload bit into. */
export function FxEmbed() {
  const ref = useCanvasLoop((ctx, w, h, t) => {
    const cell = 10;
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    // Starts a third of the way in rather than off-screen left, so the panel
    // is never caught mid-cycle with nothing written yet.
    const head = ((t * 1.6 + w * 0.35) % (w + 120)) - 60;

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    for (let x = 0; x < cols; x += 1) {
      for (let y = 0; y < rows; y += 1) {
        const px = x * cell;
        const py = y * cell;
        // Deterministic per-cell noise: no allocation, stable across frames.
        const noise = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const written = px < head;
        const carries = noise > 0.62;

        if (written && carries) {
          // Bright just behind the head, then settling to a steady lit state
          // rather than fading away — the bits stay written.
          const age = Math.min(1, (head - px) / 120);
          ctx.fillStyle = BLUE;
          ctx.globalAlpha = 1 - age * 0.42;
        } else {
          ctx.fillStyle = DIM;
          ctx.globalAlpha = 0.2;
        }
        ctx.fillRect(px + 1, py + 1, cell - 3, cell - 3);
      }
    }

    // The write head itself.
    ctx.globalAlpha = 1;
    ctx.fillStyle = BLUE;
    ctx.fillRect(head, 0, 1.5, h);
    ctx.globalAlpha = 0.16;
    ctx.fillRect(head - 26, 0, 26, h);
    ctx.globalAlpha = 1;
  });

  return <Frame inner={<canvas ref={ref} className="h-full w-full" />} />;
}

/* ==========================================================================
   02 · Steganalysis — a sweep that flags what does not fit
   ========================================================================== */

/** A detector pass: the scan line crosses a field of samples and a few of
 *  them latch as suspicious behind it. */
export function FxScan() {
  const ref = useCanvasLoop((ctx, w, h, t) => {
    const bars = 46;
    const gap = w / bars;
    // Offset so the pass is already part-way across on arrival, rather than
    // showing an untouched field for the first second.
    const cycle = (t * 2.1 + w * 0.45) % (w + 200);

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < bars; i += 1) {
      const x = i * gap;
      const base = 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.4;
      const noise = Math.abs(Math.sin(i * 91.7) * 4375.5) % 1;
      const suspicious = noise > 0.84;
      const scanned = x < cycle;
      const bh = (base + (suspicious ? 0.28 : 0)) * h * 0.72;

      ctx.fillStyle = scanned && suspicious ? BLUE : DIM;
      ctx.globalAlpha = scanned ? (suspicious ? 0.95 : 0.4) : 0.18;
      ctx.fillRect(x + gap * 0.22, h - bh - 14, gap * 0.56, bh);

      // Flag marker above anything the pass latched onto.
      if (scanned && suspicious) {
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x + gap * 0.42, h - bh - 24, 3, 3);
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = BLUE;
    ctx.fillRect(cycle, 0, 1.5, h);
  });

  return <Frame inner={<canvas ref={ref} className="h-full w-full" />} />;
}

/* ==========================================================================
   03 · Cryptography — plaintext resolving into ciphertext
   ========================================================================== */

const HEX = "0123456789abcdef";

/** Rows of text that scramble and settle into hex, over and over: the shape
 *  of an encryption pass, not a padlock icon. */
export function FxCipher() {
  const ref = useCanvasLoop((ctx, w, h, t) => {
    const rows = 6;
    const rowH = h / rows;
    const perRow = Math.floor(w / 13);

    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);
    ctx.font = '12px ui-monospace, "JetBrains Mono", monospace';
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r += 1) {
      // Each row resolves on its own offset, so the block never settles at once.
      const phase = (t * 0.9 + r * 40) % 260;
      const settled = Math.max(0, Math.min(1, (phase - 60) / 120));
      const y = rowH * r + rowH / 2;

      for (let c = 0; c < perRow; c += 1) {
        const done = c / perRow < settled;
        const seed = (r * 131 + c * 17 + (done ? 0 : (t / 3) | 0)) % 16;
        ctx.fillStyle = done ? BLUE : DIM;
        ctx.globalAlpha = done ? 0.9 : 0.35;
        ctx.fillText(HEX[seed], 6 + c * 13, y);
      }
    }
    ctx.globalAlpha = 1;
  });

  return <Frame inner={<canvas ref={ref} className="h-full w-full" />} />;
}

/* ==========================================================================
   04 · Text hiding — carriers surfacing between the letters
   ========================================================================== */

const COVER = "the quick brown fox jumps over the lazy dog and waits";

/** A line of ordinary prose with the invisible carriers made visible: the
 *  markers between letters are the bits a reader never sees. */
export function FxZeroWidth() {
  const ref = useCanvasLoop((ctx, w, h, t) => {
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);
    ctx.font = '15px ui-monospace, "JetBrains Mono", monospace';
    ctx.textBaseline = "middle";

    const step = 15;
    const perLine = Math.floor((w - 24) / step);
    const lines = Math.max(1, Math.min(5, Math.floor(h / 30)));

    for (let line = 0; line < lines; line += 1) {
      const y = 26 + line * 30;
      for (let i = 0; i < perLine; i += 1) {
        const index = (line * perLine + i) % COVER.length;
        const ch = COVER[index];
        const x = 12 + i * step;

        ctx.fillStyle = DIM;
        ctx.globalAlpha = 0.55;
        ctx.fillText(ch, x, y);

        // A carrier sits in this gap, and pulses into view on its own beat.
        const carries = Math.abs(Math.sin(index * 33.7)) > 0.74;
        if (!carries) continue;
        const pulse = (Math.sin(t * 0.06 + index) + 1) / 2;
        ctx.globalAlpha = 0.15 + pulse * 0.85;
        ctx.fillStyle = BLUE;
        ctx.fillRect(x + step - 4, y - 7, 2, 14);
      }
    }
    ctx.globalAlpha = 1;
  });

  return <Frame inner={<canvas ref={ref} className="h-full w-full" />} />;
}

/* ==========================================================================
   05 · Watermarking — a mark laid over the whole surface
   ========================================================================== */

/** A repeating mark tiled across the media, breathing in and out: present
 *  everywhere, meant not to be noticed. */
export function FxWatermark() {
  const ref = useCanvasLoop((ctx, w, h, t) => {
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    // The carrier underneath.
    ctx.strokeStyle = DIM;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }

    ctx.font = 'bold 13px ui-monospace, "JetBrains Mono", monospace';
    ctx.textBaseline = "middle";

    const tileX = 132;
    const tileY = 46;
    for (let x = -tileX; x < w + tileX; x += tileX) {
      for (let y = 0; y < h + tileY; y += tileY) {
        // Each tile breathes on a slightly different beat, so the mark ripples
        // across the surface rather than blinking as one.
        const beat = (Math.sin(t * 0.03 + x * 0.01 + y * 0.05) + 1) / 2;
        const offset = ((y / tileY) % 2) * (tileX / 2);
        ctx.globalAlpha = 0.12 + beat * 0.55;
        ctx.fillStyle = BLUE;
        ctx.fillText("CV·MARK", x + offset, y);
      }
    }
    ctx.globalAlpha = 1;
  });

  return <Frame inner={<canvas ref={ref} className="h-full w-full" />} />;
}

/* ==========================================================================
   06 · Encoding — the same bytes in four alphabets
   ========================================================================== */

const WORDS = ["CIPHER", "VAULT", "PAYLOAD", "SECRET"];

function toHex(input: string) {
  return input
    .split("")
    .map((c) => c.charCodeAt(0).toString(16))
    .join(" ");
}

function toBin(input: string) {
  return input
    .split("")
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
}

function toB64(input: string) {
  // btoa is fine here: the sample words are ASCII by construction.
  try {
    return btoa(input);
  } catch {
    return input;
  }
}

/** One value shown moving between representations — text, hex, binary,
 *  base64 — which is the whole of what the module does. */
export function FxEncoding() {
  const ref = useCanvasLoop((ctx, w, h, t) => {
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, w, h);

    const word = WORDS[Math.floor(t / 240) % WORDS.length];
    const rows = [
      { label: "text", value: word },
      { label: "hex", value: toHex(word) },
      { label: "bin", value: toBin(word).slice(0, 44) },
      { label: "b64", value: toB64(word) },
    ];

    ctx.textBaseline = "middle";
    const rowH = h / rows.length;

    rows.forEach((row, index) => {
      const y = rowH * index + rowH / 2;
      // Rows arrive one after another, so the eye follows the conversion.
      const appear = Math.max(0, Math.min(1, ((t % 240) - index * 26) / 40));

      ctx.font = '10px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillStyle = DIM;
      ctx.globalAlpha = 0.7 * appear;
      ctx.fillText(row.label.toUpperCase(), 12, y);

      ctx.font = '13px ui-monospace, "JetBrains Mono", monospace';
      ctx.fillStyle = BLUE;
      ctx.globalAlpha = appear;
      // Clipped rather than wrapped: a partial line reads as a stream.
      ctx.fillText(row.value, 54, y, w - 66);
    });

    ctx.globalAlpha = 1;
  });

  return <Frame inner={<canvas ref={ref} className="h-full w-full" />} />;
}
