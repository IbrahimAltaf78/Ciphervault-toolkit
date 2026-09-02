"use client";

import { useState } from "react";
import { KeyRound, Play } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { CryptoNav } from "@/components/cryptography/CryptoNav";
import { KeyPairPanel } from "@/components/cryptography/KeyPairPanel";
import { ResultBlock } from "@/components/cryptography/ResultBlock";
import { CRYPTO_EXPLAINERS } from "@/components/cryptography/explainers";
import {
  CRYPTO_TOOLS,
  decryptEcc,
  decryptRsa,
  encryptEcc,
  encryptRsa,
  generateEccKeyPair,
  generateRsaKeyPair,
  maxPayloadBytes,
  type CryptoResult,
  type EccCurve,
  type RsaModulusLength,
} from "@/lib/crypto";
import type { ToolMode } from "@/types";

type AsymmetricId = "rsa" | "ecc";

const RSA_SIZES: RsaModulusLength[] = [2048, 3072, 4096];
const ECC_CURVES: EccCurve[] = ["P-256", "P-384", "P-521"];

/** Comparable symmetric strength, so the size selector means something. */
const CURVE_NOTE: Record<EccCurve, string> = {
  "P-256": "128-bit security — comparable to RSA-3072.",
  "P-384": "192-bit security — comparable to RSA-7680.",
  "P-521": "256-bit security — comparable to RSA-15360.",
};

export function AsymmetricTool({ id }: { id: AsymmetricId }) {
  const tool = CRYPTO_TOOLS[id];

  const [mode, setMode] = useState<ToolMode>("forward");
  const [input, setInput] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [modulus, setModulus] = useState<RsaModulusLength>(2048);
  const [curve, setCurve] = useState<EccCurve>("P-256");
  const [result, setResult] = useState<CryptoResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isEncrypting = mode === "forward";

  async function generate() {
    setIsGenerating(true);
    setResult(null);
    try {
      const pair =
        id === "rsa" ? await generateRsaKeyPair(modulus) : await generateEccKeyPair(curve);
      if (pair.ok) {
        setPublicKey(pair.value.publicKey);
        setPrivateKey(pair.value.privateKey);
      } else {
        setResult({ ok: false, error: pair.error });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function run() {
    setIsRunning(true);
    setResult(null);
    try {
      let next: CryptoResult;
      if (id === "rsa") {
        next = isEncrypting
          ? await encryptRsa(input, publicKey)
          : await decryptRsa(input, privateKey);
      } else {
        next = isEncrypting
          ? await encryptEcc(input, publicKey, curve)
          : await decryptEcc(input, privateKey, curve);
      }
      setResult(next);
    } catch (error) {
      setResult({ ok: false, error: `Unexpected failure: ${(error as Error).message}` });
    } finally {
      setIsRunning(false);
    }
  }

  function reset() {
    setInput("");
    setResult(null);
  }

  const byteCount = new TextEncoder().encode(input).length;
  const capacity = id === "rsa" ? maxPayloadBytes(modulus) : null;
  const isOverCapacity = isEncrypting && capacity !== null && byteCount > capacity;

  return (
    <div className="space-y-6">
      <CryptoNav current={id} />

      <ToolPanel
        title={tool.label}
        description={tool.tagline}
        paradigm="cryptography"
        icon={KeyRound}
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          setResult(null);
        }}
        forwardLabel={tool.forwardLabel}
        reverseLabel={tool.reverseLabel}
        explainer={CRYPTO_EXPLAINERS[id]}
      >
        <KeyPairPanel
          publicKey={publicKey}
          privateKey={privateKey}
          onPublicKeyChange={setPublicKey}
          onPrivateKeyChange={setPrivateKey}
          onGenerate={generate}
          isGenerating={isGenerating}
        >
          <div className="space-y-2">
            <span className="cv-label">{id === "rsa" ? "Modulus size" : "Curve"}</span>
            <div className="flex gap-2">
              {id === "rsa"
                ? RSA_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setModulus(size)}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                        modulus === size
                          ? "accent-soft accent-border accent-text"
                          : "border-edge text-muted hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))
                : ECC_CURVES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCurve(option)}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                        curve === option
                          ? "accent-soft accent-border accent-text"
                          : "border-edge text-muted hover:text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
            </div>
          </div>
        </KeyPairPanel>

        <p className="cv-label normal-case tracking-normal">
          {id === "rsa"
            ? `RSA-OAEP over SHA-256 — this key can carry at most ${capacity} bytes.`
            : CURVE_NOTE[curve]}
        </p>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="asymmetric-input" className="cv-label">
              {isEncrypting ? "Plaintext" : id === "rsa" ? "Ciphertext (Base64)" : "Sealed envelope"}
            </label>
            {isEncrypting && capacity !== null && (
              <span
                className={`cv-label normal-case tracking-normal ${
                  isOverCapacity ? "text-red-400" : ""
                }`}
              >
                {byteCount} / {capacity} bytes
              </span>
            )}
          </div>
          <textarea
            id="asymmetric-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={5}
            spellCheck={false}
            placeholder={isEncrypting ? "Message to encrypt..." : "Paste the payload..."}
            className="cv-field resize-y"
          />
          {isOverCapacity && (
            <p className="text-xs text-red-400">
              Too long for a {modulus}-bit key. The Hybrid tool handles payloads
              of any size.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={isRunning || !input || (isEncrypting ? !publicKey : !privateKey)}
          className="accent-soft accent-border accent-text accent-ring inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors disabled:opacity-40"
        >
          <Play aria-hidden className="size-3.5" />
          {isRunning ? "Working..." : isEncrypting ? tool.forwardLabel : tool.reverseLabel}
        </button>

        <ResultBlock
          label={isEncrypting ? "Ciphertext" : "Recovered plaintext"}
          result={result}
          isRunning={isRunning}
          onReset={reset}
          hint={`Generate or paste a key, enter a message, then press ${
            isEncrypting ? tool.forwardLabel : tool.reverseLabel
          }.`}
          filename={`ciphervault-${id}-${isEncrypting ? "ciphertext" : "plaintext"}`}
        />
      </ToolPanel>
    </div>
  );
}

export default AsymmetricTool;
