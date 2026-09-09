"use client";

import { useState } from "react";
import { Layers, Play } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import { CryptoNav } from "@/components/cryptography/CryptoNav";
import { KeyPairPanel } from "@/components/cryptography/KeyPairPanel";
import { ResultBlock } from "@/components/cryptography/ResultBlock";
import { CRYPTO_EXPLAINERS } from "@/components/cryptography/explainers";
import {
  CRYPTO_TOOLS,
  decryptHybrid,
  encryptHybrid,
  generateRsaKeyPair,
  type CryptoResult,
  type RsaModulusLength,
} from "@/lib/crypto";
import type { ToolMode } from "@/types";

const RSA_SIZES: RsaModulusLength[] = [2048, 3072, 4096];

export function HybridTool() {
  const tool = CRYPTO_TOOLS.hybrid;

  const [mode, setMode] = useState<ToolMode>("forward");
  const [input, setInput] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [modulus, setModulus] = useState<RsaModulusLength>(2048);
  const [result, setResult] = useState<CryptoResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isEncrypting = mode === "forward";

  function changeMode(next: ToolMode) {
    setMode(next);

    if (next === "reverse") {
      // SMART ROUTING: Moving to Decrypt mode.
      // If an envelope was generated, automatically load it into the input field.
      if (result?.ok) {
        setInput(result.value);
      } else {
        setInput("");
      }
    } else {
      // Returning to Encrypt mode: reset input to start fresh.
      setInput("");
    }
    setResult(null);
  }

  async function generate() {
    setIsGenerating(true);
    setResult(null);
    try {
      const pair = await generateRsaKeyPair(modulus);
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
      setResult(
        isEncrypting
          ? await encryptHybrid(input, publicKey)
          : await decryptHybrid(input, privateKey),
      );
    } catch (error) {
      setResult({ ok: false, error: `Unexpected failure: ${(error as Error).message}` });
    } finally {
      setIsRunning(false);
    }
  }

  const byteCount = new TextEncoder().encode(input).length;

  return (
    <div className="space-y-6">
      <CryptoNav current="hybrid" />

      <ToolPanel
        title={tool.label}
        description={tool.tagline}
        paradigm="cryptography"
        icon={Layers}
        mode={mode}
        onModeChange={changeMode}
        forwardLabel={tool.forwardLabel}
        reverseLabel={tool.reverseLabel}
        explainer={CRYPTO_EXPLAINERS.hybrid}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Random AES key", body: "A fresh 256-bit key, used for this one message." },
            { step: "2", title: "Body via AES-GCM", body: "Fast and authenticated, at any payload size." },
            { step: "3", title: "Key via RSA-OAEP", body: "Only the 32-byte key touches RSA." },
          ].map((stage) => (
            <div key={stage.step} className="rounded-lg border border-edge bg-background/40 p-3">
              <span className="accent-text font-mono text-xs">{stage.step}</span>
              <p className="mt-1 font-medium">{stage.title}</p>
              <p className="mt-0.5 text-muted">{stage.body}</p>
            </div>
          ))}
        </div>

        <KeyPairPanel
          publicKey={publicKey}
          privateKey={privateKey}
          onPublicKeyChange={setPublicKey}
          onPrivateKeyChange={setPrivateKey}
          onGenerate={generate}
          isGenerating={isGenerating}
        >
          <div className="space-y-2">
            <span className="cv-label">RSA modulus size</span>
            <div className="flex gap-2">
              {RSA_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setModulus(size)}
                  className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${modulus === size
                      ? "accent-soft accent-border accent-text"
                      : "border-edge text-muted hover:text-foreground"
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </KeyPairPanel>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="hybrid-input" className="cv-label">
              {isEncrypting ? "Plaintext (any length)" : "Sealed envelope"}
            </label>
            {isEncrypting && input && (
              <span className="cv-label normal-case tracking-normal">
                {byteCount} bytes
                {byteCount > 190 && " — RSA alone could not carry this"}
              </span>
            )}
          </div>
          <textarea
            id="hybrid-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={
              isEncrypting
                ? "Paste a whole document if you like — there is no size limit here..."
                : "Paste a CV1 hybrid envelope..."
            }
            className="cv-field resize-y"
          />
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
          label={isEncrypting ? "Sealed envelope" : "Recovered plaintext"}
          result={result}
          isRunning={isRunning}
          onReset={() => {
            setInput("");
            setResult(null);
          }}
          hint="Generate a key pair, enter a message, then press Encrypt."
          filename={`ciphervault-hybrid-${isEncrypting ? "sealed" : "plaintext"}`}
        />
      </ToolPanel>
    </div>
  );
}

export default HybridTool;