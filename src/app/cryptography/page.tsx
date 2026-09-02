"use client";

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

  return (
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
  );
}