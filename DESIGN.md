# CipherVault: Design System, Color Palette & Typography Specification

## 1. Visual Theme & Aesthetic Direction
CipherVault adopts a **dark-first cybersecurity aesthetic**. The visual interface combines clean, high-contrast slate surfaces with vibrant accent colors representing different security paradigms (e.g., Matrix Green for Steganography, Cyber Cyan for Cryptography, Electric Violet for Watermarking).

---

## 2. Color Palette & CSS Tokens

### Theme Colors (Tailwind CSS Variables)

| Token               | Hex / Class             | Description & Purpose                                   |
| :------------------ | :---------------------- | :------------------------------------------------------ |
| **Background**      | `#090d16` / `slate-950` | Primary app background (deep dark slate).               |
| **Card / Surface**  | `#0f172a` / `slate-900` | Tool panel containers, dialogs, and navigation drawers. |
| **Border / Muted**  | `#1e293b` / `slate-800` | Subtle structural dividers and card borders.            |
| **Foreground Text** | `#f8fafc` / `slate-50`  | Primary high-contrast body and heading text.            |
| **Muted Text**      | `#94a3b8` / `slate-400` | Secondary descriptions, labels, and metadata text.      |

### Paradigm Accent Colors

| Module Paradigm       | Hex       | Accent Color    | Use Case                                          |
| :-------------------- | :-------- | :-------------- | :------------------------------------------------ |
| **Cryptography**      | `#8b5cf6` | Electric Violet | AES, RSA, ECC, Hashing active states & buttons.   |
| **Steganography**     | `#10b981` | Emerald Green   | Image, Audio, Video payload embedding indicators. |
| **Text-Based Hiding** | `#06b6d4` | Cyber Cyan      | Unicode zero-width & whitespace tool elements.    |
| **Encoding**          | `#3b82f6` | Cobalt Blue     | Base64, Hex, Binary converter highlights.         |
| **Covert Channels**   | `#f59e0b` | Amber Gold      | Packet timing & storage channel visualizers.      |
| **Watermarking**      | `#ec4899` | Neon Pink       | Copyright mark & tamper-detection status badges.  |

---

## 3. Typography & Font Hierarchy

### Font Families
* **Primary UI Font:** `Inter` or `Geast Sans` (Sans-serif) — Clean, highly legible typeface for navigation, body text, buttons, and form labels.
* **Code & Payload Font:** `JetBrains Mono` or `Fira Code` (Monospace) — Used exclusively for key inputs, ciphertexts, hexadecimal outputs, binary streams, and code visualizers.

### Type Scale

| Element                 | Size              | Weight          | Line Height | Application                                           |
| :---------------------- | :---------------- | :-------------- | :---------- | :---------------------------------------------------- |
| **Display / H1**        | `2.25rem` (36px)  | Bold (700)      | `1.2`       | Hero section title, major landing headers.            |
| **Section Header / H2** | `1.5rem` (24px)   | SemiBold (600)  | `1.3`       | Tool module page titles, section dividers.            |
| **Card Title / H3**     | `1.125rem` (18px) | Medium (500)    | `1.4`       | Input/Output panel titles, drawer headers.            |
| **Body Text**           | `0.875rem` (14px) | Regular (400)   | `1.5`       | Descriptions, educational card text, labels.          |
| **Code / Payload**      | `0.875rem` (14px) | Monospace (400) | `1.6`       | Encrypted text boxes, hex dumps, binary views.        |
| **Captions / Badges**   | `0.75rem` (12px)  | Medium (500)    | `1.4`       | Status indicators (`SUCCESS`, `FAILED`, `ENCRYPTED`). |

---

## 4. Component Design & Interaction Rules

* **Glassmorphic Cards:** Panel cards utilize `bg-slate-900/80` with a subtle `backdrop-blur-md` and `border border-slate-800` for depth.
* **Interactive Toggles:** Mode toggle switches (`Hide/Encrypt` vs `Extract/Decrypt`) feature smooth CSS transitions with high-contrast active state indicators.
* **Status Badges:**
  * **Success / Encrypted:** Solid background `emerald-950` with text `emerald-400` and border `emerald-800`.
  * **Error / Invalid Key:** Solid background `red-950` with text `red-400` and border `red-800`.
* **Payload Dropzones:** File upload areas display dashed borders (`border-dashed border-slate-700`) that turn accent color on hover or file drag events.

---

## Addendum — Phosphor theme (current)

The palette above describes the original six-accent treatment. The interface now
ships a **monochrome phosphor CRT** theme instead: one green hue across every
module, on a near-black ground, with the light bleeding past each edge the way it
does on a real tube.

| Token | Hex | Purpose |
| :--- | :--- | :--- |
| `--color-phos-void` | `#050a06` | Outside the screen bezel |
| `--color-phos-deep` | `#071008` | Screen ground |
| `--color-phos-panel` | `#0a1a0e` | Card and panel fill |
| `--color-phos-line` | `#1c4d2a` | Resting borders |
| `--color-phos-dim` | `#2f7a44` | Secondary text |
| `--color-phos` | `#22c55e` | The phosphor itself |
| `--color-phos-hot` | `#4ade80` | Highlights and hover |
| `--color-phos-white` | `#d9ffe4` | Headline ink |

**What this trades away.** The six paradigm accents gave each module its own
identity at a glance. A monochrome theme cannot do that, so module identity moved
to the icon and the label.  in  is kept
and now maps every paradigm to the same green — editing that one table is all it
would take to give the six their colours back.

**What is deliberately not green.** Status colours stay as they were: red for a
failure, amber for a warning, emerald for success. Those carry meaning, and folding
them into the theme hue would throw that meaning away.
