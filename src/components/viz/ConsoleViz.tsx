/**
 * Console visualisations.
 *
 * Every figure here is drawn from a fixed seed rather than `Math.random`, for
 * the same reason the rest of the site is: React renders on the server and
 * again on the client, and two different figures would be a hydration
 * mismatch. Nothing runs after first paint — the motion is CSS on SVG nodes,
 * so these cost one paint and then idle.
 *
 * These are SAMPLE figures on the landing page. They are shaped like the real
 * output of the analysis module but they are not measuring anything, and the
 * panels that use them say so. Dressing a security tool's front page in data
 * that pretends to be live is the one thing it cannot do.
 */

/** Small deterministic PRNG — a linear congruential generator. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/* ==========================================================================
   Radar — the big board
   ========================================================================== */

/**
 * Polar sweep with contacts. Pure geometry rather than a world map: a map
 * needs real continent data to be honest, and an abstract grid says
 * "scanning" without claiming to show anywhere real.
 */
export function Radar({ className, contacts = 7 }: { className?: string; contacts?: number }) {
  const random = seeded(770211);

  const blips = Array.from({ length: contacts }, (_, index) => {
    const angle = random() * Math.PI * 2;
    // sqrt spreads contacts evenly by area rather than bunching them at the pin.
    const radius = 9 + Math.sqrt(random()) * 33;
    return {
      id: index,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      r: 0.7 + random() * 0.9,
      delay: random() * 4,
    };
  });

  return (
    <svg aria-hidden className={className} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="cv-radar-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--viz-1)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--viz-1)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[14, 26, 38, 46].map((r) => (
        <circle key={r} className="cv-radar-ring" cx="50" cy="50" r={r} />
      ))}

      {[0, 45, 90, 135].map((deg) => (
        <line
          key={deg}
          className="cv-radar-ring"
          x1={50 - 46 * Math.cos((deg * Math.PI) / 180)}
          y1={50 - 46 * Math.sin((deg * Math.PI) / 180)}
          x2={50 + 46 * Math.cos((deg * Math.PI) / 180)}
          y2={50 + 46 * Math.sin((deg * Math.PI) / 180)}
        />
      ))}

      {/* The wedge and its leading edge rotate together as one group. */}
      <g className="cv-radar-arm">
        <path d="M50 50 L96 50 A46 46 0 0 0 82.5 17.5 Z" fill="url(#cv-radar-sweep)" />
        <line x1="50" y1="50" x2="96" y2="50" className="cv-radar-line" />
      </g>

      {blips.map((blip) => (
        <g key={blip.id}>
          <circle
            className="cv-blip-halo"
            cx={blip.x}
            cy={blip.y}
            r={blip.r}
            style={{ animationDelay: `${blip.delay}s` }}
          />
          <circle
            className="cv-blip"
            cx={blip.x}
            cy={blip.y}
            r={blip.r}
            style={{ animationDelay: `${blip.delay}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

/* ==========================================================================
   Waveform — the audio carrier
   ========================================================================== */

/**
 * A lossless waveform with its payload region marked. Mirrored envelopes
 * rather than a single line, because that is what a sample stream looks like
 * in every audio editor and the shape is instantly recognisable.
 */
export function Waveform({ className, bars = 64 }: { className?: string; bars?: number }) {
  const random = seeded(31447);

  const samples = Array.from({ length: bars }, (_, index) => {
    // An envelope that swells and settles, so it reads as recorded sound
    // rather than as noise.
    const envelope = Math.sin((index / bars) * Math.PI) ** 0.7;
    return {
      index,
      height: (0.18 + random() * 0.82) * envelope,
      payload: index > bars * 0.36 && index < bars * 0.64,
    };
  });

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${bars * 4} 60`}
      preserveAspectRatio="none"
    >
      {samples.map((sample) => {
        const h = Math.max(1.5, sample.height * 26);
        return (
          <rect
            key={sample.index}
            className={sample.payload ? "cv-wave-bar cv-wave-bar--hot" : "cv-wave-bar"}
            x={sample.index * 4}
            y={30 - h}
            width="2"
            height={h * 2}
            rx="1"
            style={{ animationDelay: `${sample.index * 20}ms` }}
          />
        );
      })}
    </svg>
  );
}

/* ==========================================================================
   Histogram — pixel value distribution
   ========================================================================== */

/**
 * The figure steganalysis actually produces: a value histogram whose even and
 * odd buckets pull level when LSB data is present. The pairing is the tell,
 * so alternate bars take the second hue to make it visible — and because the
 * two hues carry meaning, the panel using this legends them.
 */
export function Histogram({ className, bins = 40 }: { className?: string; bins?: number }) {
  const random = seeded(90822);

  const values = Array.from({ length: bins }, (_, index) => {
    const centre = Math.exp(-(((index - bins * 0.45) / (bins * 0.28)) ** 2));
    return 0.12 + centre * (0.55 + random() * 0.45);
  });

  const max = Math.max(...values);

  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${bins * 5} 60`}
      preserveAspectRatio="none"
    >
      {values.map((value, index) => {
        const h = (value / max) * 54;
        return (
          <rect
            key={index}
            className={index % 2 === 0 ? "cv-hist-bar" : "cv-hist-bar cv-hist-bar--odd"}
            x={index * 5}
            y={58 - h}
            width="3"
            height={h}
            rx="1.2"
            style={{ animationDelay: `${index * 15}ms` }}
          />
        );
      })}
    </svg>
  );
}

/* ==========================================================================
   Bit plane — where LSB writes
   ========================================================================== */

/** The least significant bit plane as a cell grid: the surface a payload is
 *  actually written onto. Lit cells carry a one. */
export function BitPlane({
  className,
  cols = 34,
  rows = 10,
}: { className?: string; cols?: number; rows?: number }) {
  const random = seeded(560913);

  const cells = Array.from({ length: cols * rows }, (_, index) => ({
    index,
    x: index % cols,
    y: Math.floor(index / cols),
    on: random() > 0.53,
    delay: random() * 2.6,
  }));

  return (
    <svg aria-hidden className={className} viewBox={`0 0 ${cols * 6} ${rows * 6}`}>
      {cells.map((cell) => (
        <rect
          key={cell.index}
          className={cell.on ? "cv-bit cv-bit--on" : "cv-bit"}
          x={cell.x * 6 + 0.7}
          y={cell.y * 6 + 0.7}
          width="4.1"
          height="4.1"
          style={cell.on ? { animationDelay: `${cell.delay}s` } : undefined}
        />
      ))}
    </svg>
  );
}

/* ==========================================================================
   Gauge — a single magnitude
   ========================================================================== */

/**
 * One number, drawn as an arc. A stat tile would carry the value just as well,
 * but the arc gives the console a dial and dials are what an instrument panel
 * is made of. The number is always present as text — the arc is never the
 * only way to read it.
 */
export function Gauge({
  value,
  label,
  readout,
  className,
}: { value: number; label: string; readout: string; className?: string }) {
  const radius = 34;
  const circumference = Math.PI * radius; // a half turn
  const filled = circumference * Math.min(1, Math.max(0, value));

  return (
    <div className={className}>
      <svg aria-hidden viewBox="0 0 100 54" className="w-full">
        <path
          className="cv-gauge-track"
          d={`M ${50 - radius} 50 A ${radius} ${radius} 0 0 1 ${50 + radius} 50`}
        />
        <path
          className="cv-gauge-fill"
          d={`M ${50 - radius} 50 A ${radius} ${radius} 0 0 1 ${50 + radius} 50`}
          style={{
            strokeDasharray: `${circumference}`,
            strokeDashoffset: `${circumference - filled}`,
          }}
        />
      </svg>
      <div className="-mt-2.5 text-center">
        <div className="font-mono text-xl font-bold tabular-nums text-[var(--viz-1)]">
          {readout}
        </div>
        <div className="cv-label mt-0.5">{label}</div>
      </div>
    </div>
  );
}
