"use client";

import { useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { CryptoNav } from "@/components/cryptography/CryptoNav";
import { ResultBlock } from "@/components/cryptography/ResultBlock";
import { CRYPTO_EXPLAINERS } from "@/components/cryptography/explainers";
import {
  compareDigest,
  CRYPTO_TOOLS,
  digestBits,
  hashText,
  SHA2_ALGORITHMS,
  SHA3_ALGORITHMS,
  type CryptoResult,
  type HashAlgorithm,
} from "@/lib/crypto";
import type { ToolMode } from "@/types";

type HashingId = "sha256" | "sha3";

export function HashingTool({ id }: { id: HashingId }) {
  const tool = CRYPTO_TOOLS[id];
  const variants: readonly HashAlgorithm[] =
    id === "sha256" ? SHA2_ALGORITHMS : SHA3_ALGORITHMS;

  const [mode, setMode] = useState<ToolMode>("forward");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>(variants[0]);
  const [input, setInput] = useState("");
  const [expected, setExpected] = useState("");
  const [result, setResult] = useState<CryptoResult | null>(null);

  // Digests are fast enough to recompute on every keystroke, unlike the
  // password-derived ciphers, so there is no Run button here. Hashing happens
  // in the change handlers rather than an effect — this is a reaction to user
  // input, not a synchronisation with anything external.
  const latest = useRef(0);

  async function recompute(text: string, algo: HashAlgorithm) {
    if (!text) {
      setResult(null);
      return;
    }
    // hashText is async, so a fast typist can resolve two calls out of order.
    // Only the newest one is allowed to land.
    const ticket = (latest.current += 1);
    const next = await hashText(text, algo);
    if (ticket === latest.current) setResult(next);
  }

  function changeInput(value: string) {
    setInput(value);
    void recompute(value, algorithm);
  }

  function changeAlgorithm(next: HashAlgorithm) {
    setAlgorithm(next);
    void recompute(input, next);
  }

  function changeMode(next: ToolMode) {
    setMode(next);

    if (next === "reverse" && result?.ok) {
      // SMART ROUTING: User switched to Verify. 
      // Keep their message and result intact, but copy the hash to the Expected field
      // so the UI immediately shows a "Digests match" success state.
      setExpected(result.value);
    } else if (next === "forward") {
      // Going back to Hash: just clear the expected digest.
      setExpected("");
    } else {
      // Fallback
      setInput("");
      setExpected("");
      setResult(null);
    }
  }

  const digest = result?.ok ? result.value : "";
  const isVerifying = mode === "reverse";
  const matches = isVerifying && digest && expected ? compareDigest(digest, expected) : null;

  return (
    <div className="space-y-6">
      <CryptoNav current={id} />

      <ToolPanel
        title={tool.label}
        description={tool.tagline}
        paradigm="cryptography"
        icon={Fingerprint}
        mode={mode}
        onModeChange={changeMode}
        forwardLabel={tool.forwardLabel}
        reverseLabel={tool.reverseLabel}
        explainer={CRYPTO_EXPLAINERS[id]}
      >
        <div className="rounded-lg border border-edge bg-background/40 px-4 py-3 text-muted">
          Hashing is one-way. There is no key and nothing to reverse — verifying
          means hashing the input again and comparing the two digests.
        </div>

        <div className="space-y-2">
          <span className="cv-label">Digest length</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeAlgorithm(option)}
                className={`rounded-lg border px-3 py-2 font-mono text-xs transition-colors ${algorithm === option
                    ? "accent-soft accent-border accent-text"
                    : "border-edge text-muted hover:text-foreground"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="cv-label normal-case tracking-normal">
            {digestBits(algorithm)}-bit digest, {digestBits(algorithm) / 4} hex characters
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="hash-input" className="cv-label">
            Message
          </label>
          <textarea
            id="hash-input"
            value={input}
            onChange={(event) => changeInput(event.target.value)}
            rows={5}
            spellCheck={false}
            placeholder="Type or paste anything — the digest updates as you type..."
            className="cv-field resize-y"
          />
        </div>

        {isVerifying && (
          <div className="space-y-2">
            <label htmlFor="expected-digest" className="cv-label">
              Expected digest
            </label>
            <textarea
              id="expected-digest"
              value={expected}
              onChange={(event) => setExpected(event.target.value)}
              rows={2}
              spellCheck={false}
              placeholder="Paste the digest you are checking against..."
              className="cv-field resize-y"
            />
            {matches !== null && (
              <span
                className={
                  matches
                    ? "cv-badge border-edge bg-phos-deep/60 text-[#60A5FA]"
                    : "cv-badge border-red-800 bg-red-950/60 text-red-400"
                }
              >
                {matches ? "Digests match" : "Digests differ"}
              </span>
            )}
          </div>
        )}

        <ResultBlock
          label={`${algorithm} digest`}
          result={result}
          isRunning={false}
          onReset={() => {
            setInput("");
            setExpected("");
            setResult(null);
          }}
          hint="The digest appears here as you type."
          filename={`ciphervault-${algorithm.toLowerCase()}-digest`}
        />
      </ToolPanel>
    </div>
  );
}

export default HashingTool;