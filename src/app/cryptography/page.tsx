import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CRYPTO_FAMILIES,
  CRYPTO_TOOLS,
  CRYPTO_TOOL_IDS,
} from "@/lib/crypto";

<<<<<<< HEAD
export const metadata: Metadata = {
  title: "Cryptography — CipherVault",
  description:
    "AES, DES, Triple DES, RSA, ECC, SHA-2, SHA-3 and hybrid encryption, all executed in the browser.",
};
=======
import { useState, DragEvent } from "react";
import { KeyRound } from "lucide-react";
import { ToolPanel } from "@/components/shared/ToolPanel";
import type { ToolMode } from "@/types";

export default function CryptographyPage() {
  const [mode, setMode] = useState<ToolMode>("forward"); // forward = Encrypt, reverse = Decrypt
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleModeChange = (newMode: ToolMode) => {
    setMode(newMode);
    setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || !passphrase.trim()) {
      setError("Please select a file and enter a valid passphrase.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("passphrase", passphrase);

    const endpoint = mode === "forward" ? "/api/crypto/encrypt" : "/api/crypto/decrypt";

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || `Operation failed (${res.status})`);
      }

      const blob = await res.blob();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || "Cryptography operation failed.");
    } finally {
      setLoading(false);
    }
  };
>>>>>>> 532a0c0 (fix: resolve routing structure and verify dynamic tool sub-routes)

/** Hub grouping the eight tools by family. */
export default function CryptographyHubPage() {
  return (
<<<<<<< HEAD
    <div
      className="space-y-10"
      style={{ "--cv-accent": "#8b5cf6" } as React.CSSProperties}
    >
      <header className="space-y-3">
        <p className="cv-label accent-text">Cryptography</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Eight algorithms, one browser tab
        </h1>
        <p className="max-w-2xl text-muted">
          Everything here runs through the native WebCrypto API where the
          platform provides it. Keys are derived in your browser, held for the
          length of one operation, and never sent anywhere or written to a log.
        </p>
      </header>

      {CRYPTO_FAMILIES.map((family) => {
        const tools = CRYPTO_TOOL_IDS.map((id) => CRYPTO_TOOLS[id]).filter(
          (tool) => tool.family === family.family,
        );

        return (
          <section key={family.family} className="space-y-4">
            <div className="space-y-1 border-b border-edge pb-3">
              <h2 className="text-xl font-semibold tracking-tight">{family.label}</h2>
              <p className="text-muted">{family.blurb}</p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/cryptography/${tool.path}`}
                    className="cv-card accent-ring group flex h-full flex-col rounded-xl border border-edge bg-surface/70 p-5 backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-medium tracking-tight">
                        {tool.label}
                      </h3>
                      <ArrowRight
                        aria-hidden
                        className="accent-text size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>

                    <p className="mt-1.5 flex-1 text-muted">{tool.tagline}</p>

                    {tool.status && (
                      <span
                        className={`cv-badge mt-4 w-fit ${
                          tool.status.tone === "warn"
                            ? "border-amber-800 bg-amber-950/50 text-amber-400"
                            : "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                        }`}
                      >
                        {tool.status.text}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
=======
    <ToolPanel
      title="Cryptography"
      description="AES-256 file encryption and decryption."
      paradigm="cryptography"
      icon={KeyRound}
      mode={mode}
      onModeChange={handleModeChange}
      forwardLabel="Encrypt"
      reverseLabel="Decrypt"
      explainer={
        <p>
          Keys and passphrases are processed securely for the length of one operation
          and are never stored or logged.
        </p>
      }
    >
      <div className="space-y-6">
        {/* Drag & Drop Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer bg-slate-950/50 ${isDragging
            ? "border-cyan-400 bg-cyan-950/20"
            : file
              ? "border-emerald-500/50 bg-slate-900/60"
              : "border-slate-800 hover:border-slate-700"
            }`}
        >
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="space-y-1">
              <div className="text-emerald-400 font-semibold text-base">
                ✓ Selected File: {file.name}
              </div>
              <p className="text-slate-500 text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-slate-300 font-medium">
                Drag and drop your target file here
              </div>
              <p className="text-slate-500 text-xs">or click to browse from your computer</p>
            </div>
          )}
        </div>

        {/* Passphrase Field */}
        <div>
          <label className="text-sm text-slate-300 font-medium">Passphrase / Secret Key</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter passphrase..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none mt-1 transition"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !file}
          className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-40 transition"
        >
          {loading ? "Processing..." : mode === "forward" ? "Encrypt File" : "Decrypt File"}
        </button>

        {/* Errors */}
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Output Download Link */}
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={
              mode === "forward"
                ? `${file?.name}.enc`
                : file?.name.replace(".enc", "") || "decrypted_file"
            }
            className="block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
          >
            Download {mode === "forward" ? "Encrypted File" : "Decrypted File"}
          </a>
        )}
      </div>
    </ToolPanel>
>>>>>>> 532a0c0 (fix: resolve routing structure and verify dynamic tool sub-routes)
  );
}