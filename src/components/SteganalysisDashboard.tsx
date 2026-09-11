'use client';

import React, { useState } from 'react';
import { AnalysisReport, Anomaly } from '@/types/steganalysis';
import { describeError } from "@/lib/errors";

export default function SteganalysisDashboard() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setReport(null);
            setError(null);
        }
    };

    const analyzeImage = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/analyze/image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Analysis failed with status: ${response.status}`);
            }

            const data: AnalysisReport = await response.json();
            setReport(data);
        } catch (err: unknown) {
            setError(describeError(err) || 'An error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity: Anomaly['severity']) => {
        const styles = {
            HIGH: 'bg-red-500/20 text-red-400 border-red-500/50',
            MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            LOW: 'bg-phos/20 text-phos-hot border-phos/50',
        };
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[severity]}`}>
                {severity}
            </span>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 text-white">
            <h1 className="text-2xl font-bold">Steganalysis Image Inspector</h1>

            {/* Upload Controls */}
            <div className="flex items-center gap-4 p-4 border border-phos-line rounded-lg bg-phos-panel">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-phos-dim file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-phos file:text-white hover:file:bg-phos cursor-pointer"
                />
                <button
                    onClick={analyzeImage}
                    disabled={!file || loading}
                    className="px-5 py-2 bg-phos-faint hover:bg-[#60A5FA] disabled:opacity-50 font-semibold rounded transition"
                >
                    {loading ? 'Analyzing...' : 'Run Analysis'}
                </button>
            </div>

            {error && <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">{error}</div>}

            {/* Results Section */}
            {report && (
                <div className="space-y-6">
                    {/* Probability Score Header */}
                    <div className={`p-6 rounded-lg border flex items-center justify-between ${report.is_suspicious
                            ? 'bg-red-950/40 border-red-700'
                            : 'bg-phos-deep/40 border-phos-edge'
                        }`}>
                        <div>
                            <p className="text-sm uppercase tracking-wider text-phos-dim">Suspicion Status</p>
                            <h2 className="text-xl font-bold">
                                {report.is_suspicious ? 'Payload Detected / Suspicious' : 'Clean / Normal Image'}
                            </h2>
                            <p className="text-xs text-phos-dim mt-1">File: {report.filename}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-phos-dim">Probability Score</p>
                            <p className="text-3xl font-extrabold">{(report.probability_score * 100).toFixed(0)}%</p>
                        </div>
                    </div>

                    {/* Anomaly Breakdown */}
                    <div className="p-6 border border-phos-line bg-phos-panel rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold border-b border-phos-line pb-2">
                            Detected Anomalies ({report.anomalies.length})
                        </h3>
                        {report.anomalies.length === 0 ? (
                            <p className="text-phos-dim text-sm">No statistical or metadata anomalies detected.</p>
                        ) : (
                            <div className="space-y-3">
                                {report.anomalies.map((item, idx) => (
                                    <div key={idx} className="p-3 bg-phos-line/60 rounded border border-phos-line/50 flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm text-phos-white">{item.category}</span>
                                                {getSeverityBadge(item.severity)}
                                            </div>
                                            <p className="text-xs text-phos-dim">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Extracted Metadata */}
                    <div className="p-6 border border-phos-line bg-phos-panel rounded-lg space-y-2">
                        <h3 className="text-lg font-semibold border-b border-phos-line pb-2">Technical Metadata</h3>
                        <pre className="text-xs text-phos-dim overflow-x-auto bg-phos-deep p-3 rounded">
                            {JSON.stringify(report.metadata, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}