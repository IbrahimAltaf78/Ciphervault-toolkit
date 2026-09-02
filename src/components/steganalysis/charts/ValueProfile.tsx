"use client";

import { useId, useState } from "react";
import type { ChannelHistogram } from "@/lib/steganalysis/types";
import { AXIS_INK, CHART_SURFACE, SERIES_PRIMARY } from "./palette";

const WIDTH = 320;
const HEIGHT = 96;

interface Hover {
  value: number;
  count: number;
  x: number;
}

/**
 * The 256-bin value distribution for one channel.
 *
 * Shows shape rather than magnitude: sequential LSB embedding pulls each
 * adjacent pair (2i, 2i+1) toward its mean, turning a smooth natural curve into
 * a visible stair-step.
 *
 * Drawn as an area-and-line profile rather than 256 bars — at this width each
 * bar would be a fifth of a pixel, so bar geometry (rounded ends, gaps between
 * fills) would be invisible at best and moiré at worst.
 *
 * One series per panel, so no colour encoding is needed at all; the caption
 * carries the identity.
 */
export function ValueProfile({ histogram }: { histogram: ChannelHistogram }) {
  const gradientId = useId();
  const [hover, setHover] = useState<Hover | null>(null);

  const peak = Math.max(...histogram.bins, 1);
  const stepX = WIDTH / 255;
  const toY = (count: number) => HEIGHT - (count / peak) * (HEIGHT - 6);

  const line = histogram.bins
    .map((count, value) => `${value === 0 ? "M" : "L"}${(value * stepX).toFixed(2)},${toY(count).toFixed(2)}`)
    .join(" ");
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  function trackPointer(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const value = Math.max(0, Math.min(255, Math.round(ratio * 255)));
    setHover({ value, count: histogram.bins[value], x: value * stepX });
  }

  return (
    <figure className="space-y-1.5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="cv-label">{histogram.channel}</span>
        <span className="cv-label normal-case tracking-normal">
          peak {peak.toLocaleString()}
        </span>
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          aria-label={`Value distribution for the ${histogram.channel} channel across 256 levels`}
          onPointerMove={trackPointer}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_PRIMARY} stopOpacity="0.35" />
              <stop offset="100%" stopColor={SERIES_PRIMARY} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke={SERIES_PRIMARY} strokeWidth="2" strokeLinejoin="round" />

          {hover && (
            <g>
              <line
                x1={hover.x}
                y1="0"
                x2={hover.x}
                y2={HEIGHT}
                stroke={AXIS_INK}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* 2px surface ring keeps the marker legible over the fill. */}
              <circle
                cx={hover.x}
                cy={toY(hover.count)}
                r="4"
                fill={SERIES_PRIMARY}
                stroke={CHART_SURFACE}
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {hover && (
          <div className="pointer-events-none absolute -top-1 left-0 right-0 flex justify-center">
            <span className="cv-badge border-edge bg-surface text-foreground">
              value {hover.value} · {hover.count.toLocaleString()} px
            </span>
          </div>
        )}
      </div>
    </figure>
  );
}

export default ValueProfile;
