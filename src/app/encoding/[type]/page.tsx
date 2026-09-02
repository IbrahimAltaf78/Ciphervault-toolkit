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
          <p className="text-slate-400 text-sm mt-1">
            Transform text UTF-8 bitstreams into {codecType} format and back.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1">
          <button
            onClick={() => { setMode("encode"); setOutput(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${mode === "encode" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
          >
            Encode
          </button>
          <button
            onClick={() => { setMode("decode"); setOutput(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${mode === "decode" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
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
        placeholder={`Enter content to ${mode}...`}
        className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none transition"
      />

      <button
        onClick={handleProcess}
        disabled={loading || !input.trim()}
        className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-40 transition"
      >
        {loading ? "Processing..." : `${mode === "encode" ? "Encode" : "Decode"} Payload`}
      </button>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {output && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-cyan-400">Result:</h2>
          <textarea
            readOnly
            rows={5}
            value={output}
            className="w-full bg-slate-950 p-3 rounded-xl font-mono text-emerald-400 border border-slate-800 outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
          >
            Copy Output
          </button>
        </div>
      )}
    </div>
  );
}