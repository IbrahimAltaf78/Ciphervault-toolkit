"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function TextHidingToolPage() {
  const params = useParams();
  const techniqueType = (params?.technique as string) || "zero-width";

  const [mode, setMode] = useState<"hide" | "reveal">("hide");
  const [coverText, setCoverText] = useState("");
  const [secretText, setSecretText] = useState("");
  const [stegoText, setStegoText] = useState("");
  const [extractedSecret, setExtractedSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabSwitch = (newMode: "hide" | "reveal") => {
    setMode(newMode);
    setError(null);
    setExtractedSecret("");
  };

  const handleProcess = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === "hide") {
        if (!coverText.trim() || !secretText.trim()) {
          throw new Error("Both cover text and secret payload are required.");
        }

        const res = await fetch("http://localhost:8000/api/text-hiding/hide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            technique: techniqueType,
            cover_text: coverText,
            secret_text: secretText,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || `Server error (${res.status})`);
        }

        const data = await res.json();
        setStegoText(data.stego_text);
      } else {
        if (!stegoText.trim()) {
          throw new Error("Please enter or paste the steganographic text.");
        }

        const res = await fetch("http://localhost:8000/api/text-hiding/reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            technique: techniqueType,
            stego_text: stegoText,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || `Server error (${res.status})`);
        }

        const data = await res.json();
        setExtractedSecret(data.secret_text || "No hidden text detected.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white capitalize">
          {techniqueType.replace("-", " ")} Steganography
        </h1>
        <p className="text-phos-dim text-sm mt-1">
          Conceal messages using client-side or server-assisted text hiding techniques.
        </p>
      </div>

      <div className="flex gap-4 border-b border-phos-line pb-3">
        <button
          onClick={() => handleTabSwitch("hide")}
          className={`font-semibold pb-1 transition ${mode === "hide"
              ? "text-phos-hot border-b-2 border-phos-hot"
              : "text-phos-dim hover:text-phos-white"
            }`}
        >
          1. Hide Text
        </button>
        <button
          onClick={() => handleTabSwitch("reveal")}
          className={`font-semibold pb-1 transition ${mode === "reveal"
              ? "text-phos-hot border-b-2 border-phos-hot"
              : "text-phos-dim hover:text-phos-white"
            }`}
        >
          2. Reveal Text
        </button>
      </div>

      {mode === "hide" ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-phos-dim font-medium">Cover Text (Public Carrier)</label>
            <textarea
              rows={3}
              value={coverText}
              onChange={(e) => setCoverText(e.target.value)}
              placeholder="Enter public text..."
              className="w-full bg-phos-panel border border-phos-line rounded-xl p-3 text-white outline-none focus:border-phos-hot mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-phos-dim font-medium">Secret Payload</label>
            <input
              type="text"
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Enter secret message to conceal..."
              className="w-full bg-phos-panel border border-phos-line rounded-xl p-3 text-white outline-none focus:border-phos-hot mt-1"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-sm text-phos-dim font-medium">Steganographic Text</label>
          <textarea
            rows={4}
            value={stegoText}
            onChange={(e) => setStegoText(e.target.value)}
            placeholder="Paste steganographic text here..."
            className="w-full bg-phos-panel border border-phos-line rounded-xl p-3 text-white outline-none focus:border-phos-hot mt-1"
          />
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={loading}
        className="w-full py-3 bg-phos text-phos-deep font-semibold rounded-xl hover:bg-phos-hot disabled:opacity-40 transition"
      >
        {loading ? "Processing..." : mode === "hide" ? "Generate Stego Text" : "Extract Secret Text"}
      </button>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {stegoText && mode === "hide" && (
        <div className="p-6 bg-phos-panel border border-phos-line rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-phos-hot">Stego Output:</h2>
          <textarea
            readOnly
            rows={3}
            value={stegoText}
            className="w-full bg-phos-deep p-3 rounded-xl font-mono text-phos-white border border-phos-line outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(stegoText)}
            className="px-4 py-2 bg-phos-line text-phos-white hover:bg-phos-dim/30 rounded-lg text-sm font-medium transition"
          >
            Copy Output
          </button>
        </div>
      )}

      {extractedSecret && mode === "reveal" && (
        <div className="p-6 bg-phos-panel border border-emerald-800/60 rounded-2xl space-y-2">
          <h2 className="text-sm text-emerald-400 font-semibold">Extracted Payload:</h2>
          <div className="p-4 bg-phos-deep rounded-xl font-mono text-phos-hot text-lg break-all border border-phos-line">
            {extractedSecret}
          </div>
        </div>
      )}
    </div>
  );
}