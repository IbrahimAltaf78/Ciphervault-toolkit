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