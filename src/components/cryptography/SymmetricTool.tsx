"use client";

import { useState } from "react";
import { Lock, Play } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { CryptoNav } from "@/components/cryptography/CryptoNav";
import { PasswordField } from "@/components/cryptography/PasswordField";
import { ResultBlock } from "@/components/cryptography/ResultBlock";
import { CRYPTO_EXPLAINERS } from "@/components/cryptography/explainers";
import {
  CRYPTO_TOOLS,
  decryptAes,
  decryptDes,
  encryptAes,
  encryptDes,
  PBKDF2_ITERATIONS,
  type AesKeyLength,
  type AesMode,
  type CryptoResult,
} from "@/lib/crypto";
import type { ToolMode } from "@/types";

type SymmetricId = "aes" | "des" | "3des";

const AES_MODES: AesMode[] = ["GCM", "CBC", "CTR"];
const AES_LENGTHS: AesKeyLength[] = [128, 192, 256];

/** What each mode actually guarantees, surfaced next to the selector. */
const MODE_NOTE: Record<AesMode, string> = {
  GCM: "Authenticated — tampering is detected on decryption.",
  CBC: "Confidentiality only — a modified ciphertext still decrypts.",
  CTR: "Stream mode — never reuse a counter with the same key.",
};

/** Fixed key size for the DES variants, which have no size selector. */
const DES_KEY_BITS: Record<"des" | "3des", string> = {
  des: "56-bit effective key (64 bits, 8 of them parity)",
  "3des": "168-bit key, 112 bits of effective security",
};

export function SymmetricTool({ id }: { id: SymmetricId }) {
  const tool = CRYPTO_TOOLS[id];

  const [mode, setMode] = useState<ToolMode>("forward");
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [aesMode, setAesMode] = useState<AesMode>("GCM");
  const [aesLength, setAesLength] = useState<AesKeyLength>(256);
  const [result, setResult] = useState<CryptoResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const isEncrypting = mode === "forward";

  async function run() {
    setIsRunning(true);
    setResult(null);
    try {
      let next: CryptoResult;
      if (id === "aes") {
        const options = { mode: aesMode, length: aesLength };
        next = isEncrypting
          ? await encryptAes(input, password, options)
          : await decryptAes(input, password, options);
      } else {
        next = isEncrypting
          ? await encryptDes(input, password, id)
          : await decryptDes(input, password, id);
      }
      setResult(next);
    } catch (error) {
      // Nothing should reach here, but a panel must never crash the page.
      setResult({ ok: false, error: `Unexpected failure: ${(error as Error).message}` });
    } finally {
      setIsRunning(false);
    }
  }

  function reset() {
    setInput("");
    setPassword("");
    setResult(null);
  }

  function changeMode(next: ToolMode) {
    setMode(next);
    setInput("");
    setPassword("");
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <CryptoNav current={id} />

      <ToolPanel
        title={tool.label}
        description={tool.tagline}
        paradigm="cryptography"
        icon={Lock}
        mode={mode}
        onModeChange={changeMode}
        forwardLabel={tool.forwardLabel}
        reverseLabel={tool.reverseLabel}
        explainer={CRYPTO_EXPLAINERS[id]}
      >
        {tool.status?.tone === "warn" && (
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-amber-300">
            <strong className="font-medium">{tool.status.text}.</strong> This
            algorithm is here to be understood, not used. Encrypt anything real
            with AES-256-GCM instead.
          </div>
        )}

        {/* Context-aware key configuration */}
        {id === "aes" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="cv-label">Key size</span>
              <div className="flex gap-2">
                {AES_LENGTHS.map((length) => (
                  <button
                    key={length}
                    type="button"
                    onClick={() => setAesLength(length)}
                    className={`flex-1 rounded-lg border px-3 py-2 font-mono text-xs transition-colors ${aesLength === length
                      ? "accent-soft accent-border accent-text"
                      : "border-edge text-muted hover:text-foreground"
                      }`}
                  >
                    {length}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="cv-label">Mode of operation</span>
              <div className="flex gap-2">
                {AES_MODES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAesMode(option)}
                    className={`flex-1 rounded-lg border px-3 py-2 font-mono text-xs transition-colors ${aesMode === option
                      ? "accent-soft accent-border accent-text"
                      : "border-edge text-muted hover:text-foreground"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <p className="cv-label normal-case tracking-normal sm:col-span-2">
              {MODE_NOTE[aesMode]}
            </p>
          </div>
        ) : (
          <p className="cv-label normal-case tracking-normal">
            Key size: {DES_KEY_BITS[id]}
          </p>
        )}

        <PasswordField
          value={password}
          onChange={setPassword}
          showStrength={isEncrypting}
          label={isEncrypting ? "Password" : "Password used to encrypt"}
        />

        <div className="space-y-2">
          <label htmlFor="symmetric-input" className="cv-label">
            {isEncrypting ? "Plaintext" : "Ciphertext envelope"}
          </label>
          <textarea
            id="symmetric-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={isEncrypting ? 5 : 4}
            spellCheck={false}
            placeholder={
              isEncrypting ? "Message to encrypt..." : "Paste a CV1 envelope..."
            }
            className="cv-field resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={isRunning || !input || !password}
            className="accent-soft accent-border accent-text accent-ring inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors disabled:opacity-40"
          >
            <Play aria-hidden className="size-3.5" />
            {isRunning ? "Working..." : isEncrypting ? tool.forwardLabel : tool.reverseLabel}
          </button>
          <span className="cv-label normal-case tracking-normal">
            PBKDF2-SHA-256, {PBKDF2_ITERATIONS.toLocaleString()} iterations
          </span>
        </div>

        <ResultBlock
          label={isEncrypting ? "Ciphertext envelope" : "Recovered plaintext"}
          result={result}
          isRunning={isRunning}
          onReset={reset}
          hint={`Enter a message and a password, then press ${isEncrypting ? tool.forwardLabel : tool.reverseLabel
            }.`}
          filename={`ciphervault-${id}-${isEncrypting ? "ciphertext" : "plaintext"}`}
        />
      </ToolPanel>
    </div>
  );
}

export default SymmetricTool;