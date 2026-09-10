"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { estimatePassword } from "@/lib/crypto";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** The meter is advice while encrypting; while decrypting it is just noise. */
  showStrength?: boolean;
  label?: string;
}

const TONE = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-[#60A5FA]",
  "bg-[#60A5FA]",
] as const;

const TEXT_TONE = [
  "text-red-400",
  "text-orange-400",
  "text-amber-400",
  "text-[#60A5FA]",
  "text-[#60A5FA]",
] as const;

/**
 * Password entry with an advisory strength meter.
 *
 * The meter is deliberately non-blocking: it never prevents encryption, because
 * refusing a weak password in a teaching tool would just hide the lesson.
 */
export function PasswordField({
  value,
  onChange,
  showStrength = true,
  label = "Password",
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const verdict = useMemo(() => estimatePassword(value), [value]);

  return (
    <div className="space-y-2">
      <label htmlFor="crypto-password" className="cv-label flex items-center gap-2">
        <KeyRound aria-hidden className="size-3.5" />
        {label}
      </label>

      <div className="relative">
        <input
          id="crypto-password"
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="Enter a passphrase..."
          className="cv-field pr-11"
        />
        <button
          type="button"
          onClick={() => setIsVisible((shown) => !shown)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-foreground"
        >
          {isVisible ? (
            <EyeOff aria-hidden className="size-4" />
          ) : (
            <Eye aria-hidden className="size-4" />
          )}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`cv-label ${TEXT_TONE[verdict.score]}`}>{verdict.label}</span>
            <span className="cv-label normal-case tracking-normal">
              ~{verdict.entropyBits} bits of entropy
            </span>
          </div>

          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  segment <= verdict.score ? TONE[verdict.score] : "bg-edge"
                }`}
              />
            ))}
          </div>

          {verdict.suggestions.length > 0 && (
            <ul className="space-y-0.5">
              {verdict.suggestions.map((suggestion) => (
                <li key={suggestion} className="text-xs text-muted">
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default PasswordField;
