"use client";

import { useState } from "react";
import { Check, Copy, KeySquare, Loader2, ShieldAlert } from "lucide-react";

interface KeyPairPanelProps {
  publicKey: string;
  privateKey: string;
  onPublicKeyChange: (value: string) => void;
  onPrivateKeyChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  /** Size or curve selector rendered above the buttons. */
  children?: React.ReactNode;
}

function PemField({
  id,
  label,
  value,
  onChange,
  isSecret,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  isSecret?: boolean;
}) {
  const [hasCopied, setHasCopied] = useState(false);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setHasCopied(true);
    window.setTimeout(() => setHasCopied(false), 1600);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="cv-label flex items-center gap-2">
          {isSecret && <ShieldAlert aria-hidden className="size-3.5 text-amber-400" />}
          {label}
        </label>
        <button type="button" onClick={copy} disabled={!value} className="cv-btn">
          {hasCopied ? (
            <Check aria-hidden className="size-3.5 text-[#60A5FA]" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
          {hasCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        spellCheck={false}
        placeholder={`-----BEGIN ${isSecret ? "PRIVATE" : "PUBLIC"} KEY-----`}
        className="cv-field resize-y text-xs"
      />
    </div>
  );
}

/**
 * Key pair generation and entry, shared by the RSA and ECC panels.
 *
 * Both keys are editable, because the realistic workflow is asymmetric in the
 * literal sense: you encrypt with someone else public key that you paste in,
 * and decrypt with your own private key.
 */
export function KeyPairPanel({
  publicKey,
  privateKey,
  onPublicKeyChange,
  onPrivateKeyChange,
  onGenerate,
  isGenerating,
  children,
}: KeyPairPanelProps) {
  return (
    <div className="space-y-4 rounded-xl border border-edge bg-background/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {children}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="cv-btn"
        >
          {isGenerating ? (
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
          ) : (
            <KeySquare aria-hidden className="size-3.5" />
          )}
          {isGenerating ? "Generating..." : "Generate key pair"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PemField
          id="public-key"
          label="Public key (encrypts)"
          value={publicKey}
          onChange={onPublicKeyChange}
        />
        <PemField
          id="private-key"
          label="Private key (decrypts)"
          value={privateKey}
          onChange={onPrivateKeyChange}
          isSecret
        />
      </div>

      <p className="cv-label normal-case tracking-normal">
        Keys are generated in your browser and never leave it. The private key is
        shown here because this is a teaching tool — a real system would never
        display one.
      </p>
    </div>
  );
}

export default KeyPairPanel;
