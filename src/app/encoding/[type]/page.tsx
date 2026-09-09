"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function EncodingToolPage() {
  const params = useParams();
  const codecType = (params?.type as string) || "base64";

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resets both input and output fields on tab change
  const handleModeChange = (newMode: "encode" | "decode") => {
    if (newMode === mode) return;
    setMode(newMode);
    setInput("");
    setOutput("");
    setError(null);
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/encoding/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          encoding_type: codecType,
          mode: mode,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.detail || "Encoding operation failed.");
      }

      const data = await res.json();
      setOutput(data.result);
    } catch (err: any) {
      setError(err.message || "An error occurred during transformation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white capitalize">{codecType} Converter</h1>
          <p className="text-phos-dim text-sm mt-1">
            Transform text UTF-8 bitstreams into {codecType} format and back.
          </p>
        </div>

        <div className="flex bg-phos-panel border border-phos-line rounded-xl p-1">
          <button
            onClick={() => handleModeChange("encode")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${mode === "encode" ? "bg-phos text-phos-deep" : "text-phos-dim hover:text-white"
              }`}
          >
            Encode
          </button>
          <button
            onClick={() => handleModeChange("decode")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${mode === "decode" ? "bg-phos text-phos-deep" : "text-phos-dim hover:text-white"
              }`}
          >
            Decode
          </button>
        </div>
      </div>

      <textarea
        rows={5}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          mode === "encode"
            ? "Enter plain text to encode..."
            : `Enter ${codecType} encoded text to decode...`
        }
        className="w-full bg-phos-panel border border-phos-line focus:border-phos-hot rounded-xl p-3 text-white outline-none transition"
      />

      <button
        onClick={handleProcess}
        disabled={loading || !input.trim()}
        className="w-full py-3 bg-phos text-phos-deep font-semibold rounded-xl hover:bg-phos-hot disabled:opacity-40 transition"
      >
        {loading ? "Processing..." : `${mode === "encode" ? "Encode" : "Decode"} Payload`}
      </button>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {output && (
        <div className="p-6 bg-phos-panel border border-phos-line rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-phos-hot">Result:</h2>
          <textarea
            readOnly
            rows={5}
            value={output}
            className="w-full bg-phos-deep p-3 rounded-xl font-mono text-emerald-400 border border-phos-line outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            className="px-4 py-2 bg-phos-line text-phos-white hover:bg-phos-dim/30 rounded-lg text-sm font-medium transition"
          >
            Copy Output
          </button>
        </div>
      )}
    </div>
  );
}