/**
 * Display formatting shared across the steganalysis UI.
 *
 * The dropzone and the report both size files, and had grown their own copies
 * of this — which is exactly how two parts of one screen end up disagreeing
 * about whether something is 1.4 MB or 1.41 MB.
 */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}
