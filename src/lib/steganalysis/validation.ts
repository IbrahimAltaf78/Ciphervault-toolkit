/**
 * Client-side gate for uploads.
 *
 * Separate from the network client because it runs in a different place and for
 * a different reason: the dropzone calls it on hover and on drop, long before
 * anything is sent, so an unusable file is rejected with a reason instead of
 * costing a round trip.
 */
import type { SuspectKind } from "./types";

/** RULES.md caps media uploads at 10 MB. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Formats the engine accepts.
 *
 * Lossless only on the image side. JPEG re-quantises on every save, so the LSB
 * plane a detector would examine has already been destroyed by the encoder —
 * a JPEG needs DCT-domain analysis, which is a different test set entirely.
 */
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/bmp", "image/tiff", "image/webp"];
/** WAV only: the engine reads audio with Python's wave module, which has no
 *  FLAC or AIFF decoder. */
export const ACCEPTED_AUDIO_TYPES = ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"];

export const ACCEPT_ATTRIBUTE = [".png", ".bmp", ".tif", ".tiff", ".webp", ".wav"].join(",");

export type FileCheck =
  | { ok: true; kind: SuspectKind }
  | { ok: false; error: string };

export function checkFile(file: File): FileCheck {
  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, error: `That file is ${mb} MB — the limit is 10 MB.` };
  }

  // Browsers are inconsistent about the MIME type they report for a drag, so
  // the extension is checked as well rather than instead.
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (ACCEPTED_IMAGE_TYPES.includes(type) || /\.(png|bmp|tiff?|webp)$/.test(name)) {
    return { ok: true, kind: "image" };
  }
  if (ACCEPTED_AUDIO_TYPES.includes(type) || /\.wav$/.test(name)) {
    return { ok: true, kind: "audio" };
  }

  if (/\.(flac|aiff?)$/.test(name) || type === "audio/flac" || type === "audio/aiff") {
    return { ok: false, error: "Only WAV audio can be analysed. Convert FLAC or AIFF files to WAV first." };
  }

  if (/\.(jpe?g)$/.test(name) || type === "image/jpeg") {
    return {
      ok: false,
      error:
        "JPEG cannot be analysed for LSB embedding — the encoder rewrites the low bits on every save. Upload a PNG, BMP or TIFF.",
    };
  }

  return {
    ok: false,
    error: "Unsupported format. Accepted: PNG, BMP, TIFF, WEBP, WAV.",
  };
}
