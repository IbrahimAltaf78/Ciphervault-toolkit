/**
 * Advisory password strength estimate.
 *
 * This is a heuristic, not a guarantee, and the UI says so. A real estimator
 * (zxcvbn and friends) matches against dictionaries, keyboard walks and leaked
 * password corpora, which needs a multi-megabyte payload. What is here instead
 * is the honest arithmetic — search space times length — with penalties for the
 * patterns that make that arithmetic a lie.
 *
 * The number that matters is entropy in bits: how many guesses an attacker
 * averages before landing on it. Anything under 40 bits falls to an offline
 * attack quickly, regardless of how clever the substitutions look.
 */
import type { PasswordVerdict } from "./types";

/** Size of the alphabet the password appears to be drawn from. */
function poolSize(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  return pool;
}

/** Sequences an attacker tries first, so they buy far less than their length. */
const SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

function hasRun(password: string, minimum = 3): boolean {
  const lower = password.toLowerCase();
  for (const sequence of SEQUENCES) {
    for (let i = 0; i + minimum <= sequence.length; i += 1) {
      const window = sequence.slice(i, i + minimum);
      if (lower.includes(window)) return true;
      if (lower.includes([...window].reverse().join(""))) return true;
    }
  }
  return false;
}

const COMMON = [
  "password", "welcome", "letmein", "admin", "qwerty", "iloveyou",
  "dragon", "monkey", "football", "master", "sunshine", "princess",
  "login", "abc123", "secret", "changeme",
];

export function estimatePassword(password: string): PasswordVerdict {
  if (!password) {
    return { score: 0, label: "Empty", entropyBits: 0, suggestions: ["Enter a passphrase."] };
  }

  const pool = poolSize(password);
  let entropy = password.length * Math.log2(pool || 1);
  const suggestions: string[] = [];

  // Repeated characters add length without adding search space.
  const uniqueRatio = new Set(password).size / password.length;
  if (uniqueRatio < 0.6) {
    entropy *= 0.7;
    suggestions.push("Avoid repeating the same few characters.");
  }

  if (hasRun(password)) {
    entropy *= 0.75;
    suggestions.push("Avoid keyboard runs and alphabet sequences.");
  }

  const lower = password.toLowerCase();
  if (COMMON.some((word) => lower.includes(word))) {
    entropy *= 0.5;
    suggestions.push("Remove common dictionary words — they are guessed first.");
  }

  // A year or a short number tacked on the end is the most predictable of all.
  if (/^.*(19|20)\d{2}$/.test(password)) {
    entropy *= 0.8;
    suggestions.push("A trailing year adds almost nothing.");
  }

  if (password.length < 12) {
    suggestions.push("Use at least 12 characters — length beats complexity.");
  }
  if (pool < 36) {
    suggestions.push("Mix in another character class.");
  }

  entropy = Math.round(entropy);

  const score: PasswordVerdict["score"] =
    entropy < 28 ? 0 : entropy < 40 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;

  const label = ["Very weak", "Weak", "Fair", "Strong", "Very strong"][score];

  if (score >= 3 && suggestions.length === 0) {
    suggestions.push("Good — a passphrase of several unrelated words is stronger still.");
  }

  return { score, label, entropyBits: entropy, suggestions };
}
