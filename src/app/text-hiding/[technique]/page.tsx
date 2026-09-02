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
        <p className="text-slate-400 text-sm mt-1">
          Conceal messages using client-side or server-assisted text hiding techniques.
        </p>
      </div>

      <div className="flex gap-4 border-b border-slate-800 pb-3">
        <button
          onClick={() => handleTabSwitch("hide")}
          className={`font-semibold pb-1 transition ${mode === "hide"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200"
            }`}
        >
          1. Hide Text
        </button>
        <button
          onClick={() => handleTabSwitch("reveal")}
          className={`font-semibold pb-1 transition ${mode === "reveal"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-slate-200"
            }`}
        >
          2. Reveal Text
        </button>
      </div>

      {mode === "hide" ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 font-medium">Cover Text (Public Carrier)</label>
            <textarea
              rows={3}
              value={coverText}
              onChange={(e) => setCoverText(e.target.value)}
              placeholder="Enter public text..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-400 mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 font-medium">Secret Payload</label>
            <input
              type="text"
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Enter secret message to conceal..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-400 mt-1"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-sm text-slate-300 font-medium">Steganographic Text</label>
          <textarea
            rows={4}
            value={stegoText}
            onChange={(e) => setStegoText(e.target.value)}
            placeholder="Paste steganographic text here..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-400 mt-1"
          />
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={loading}
        className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-40 transition"
      >
        {loading ? "Processing..." : mode === "hide" ? "Generate Stego Text" : "Extract Secret Text"}
      </button>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {stegoText && mode === "hide" && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-cyan-400">Stego Output:</h2>
          <textarea
            readOnly
            rows={3}
            value={stegoText}
            className="w-full bg-slate-950 p-3 rounded-xl font-mono text-slate-200 border border-slate-800 outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(stegoText)}
            className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
          >
            Copy Output
          </button>
        </div>
      )}

      {extractedSecret && mode === "reveal" && (
        <div className="p-6 bg-slate-900 border border-emerald-800/60 rounded-2xl space-y-2">
          <h2 className="text-sm text-emerald-400 font-semibold">Extracted Payload:</h2>
          <div className="p-4 bg-slate-950 rounded-xl font-mono text-cyan-300 text-lg break-all border border-slate-800">
            {extractedSecret}
          </div>
        </div>
      )}
    </div>
  );
}