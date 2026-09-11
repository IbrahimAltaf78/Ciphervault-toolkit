'use client';

import React, { useState } from 'react';
import { Activity, ShieldAlert, BarChart3, Upload, RefreshCw, FileAudio, Image as ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AnalysisResults {
    mse: number;
    psnrOrSnr: number;
    metricLabel: string;
    anomalyScore: number; // 0 to 100%
    verdict: 'Clean' | 'Suspicious' | 'Highly Likely Embedded';
    details: string;
}

export default function SteganalysisPage() {
    const [mediaType, setMediaType] = useState<'image' | 'audio'>('image');
    const [carrierFile, setCarrierFile] = useState<File | null>(null);
    const [stegoFile, setStegoFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [results, setResults] = useState<AnalysisResults | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'carrier' | 'stego') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (type === 'carrier') setCarrierFile(file);
            else setStegoFile(file);
            setResults(null);
            setError(null);
        }
    };

    const analyzeAudio = async (original: File, suspected: File): Promise<AnalysisResults> => {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        const origBuffer = await audioCtx.decodeAudioData(await original.arrayBuffer());
        const stegoBuffer = await audioCtx.decodeAudioData(await suspected.arrayBuffer());

        const origData = origBuffer.getChannelData(0);
        const stegoData = stegoBuffer.getChannelData(0);

        const length = Math.min(origData.length, stegoData.length);
        let mseSum = 0;
        let signalPower = 0;
        let lsbToggles = 0;

        for (let i = 0; i < length; i++) {
            const diff = origData[i] - stegoData[i];
            mseSum += diff * diff;
            signalPower += origData[i] * origData[i];

            // Measure LSB variance proxy
            if (Math.abs(diff) > 0) {
                lsbToggles++;
            }
        }

        const mse = mseSum / length;
        const snr = mse > 0 ? 10 * Math.log10(signalPower / mseSum) : 999;
        await audioCtx.close();

        const alterationRatio = (lsbToggles / length) * 100;
        let verdict: 'Clean' | 'Suspicious' | 'Highly Likely Embedded' = 'Clean';

        if (alterationRatio > 5) verdict = 'Highly Likely Embedded';
        else if (alterationRatio > 0.1) verdict = 'Suspicious';

        return {
            mse: Number(mse.toFixed(8)),
            psnrOrSnr: Number(snr.toFixed(2)),
            metricLabel: 'Signal-to-Noise Ratio (SNR)',
            anomalyScore: Math.min(100, Number((alterationRatio * 10).toFixed(1))),
            verdict,
            details: `Detected sample variance across ${length.toLocaleString()} audio samples. LSB distortion rate: ${alterationRatio.toFixed(3)}%.`,
        };
    };

    const analyzeImage = async (original: File, suspected: File): Promise<AnalysisResults> => {
        return new Promise((resolve) => {
            const imgOrig = new Image();
            const imgStego = new Image();
            let loadedCount = 0;

            const process = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                const width = Math.min(imgOrig.width, imgStego.width);
                const height = Math.min(imgOrig.height, imgStego.height);
                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(imgOrig, 0, 0, width, height);
                const origPixels = ctx.getImageData(0, 0, width, height).data;

                ctx.drawImage(imgStego, 0, 0, width, height);
                const stegoPixels = ctx.getImageData(0, 0, width, height).data;

                let mseSum = 0;
                let alteredPixels = 0;
                const totalPixels = origPixels.length / 4;

                // Chi-Square bucket pairs (PoVs - Pairs of Values)
                const pov = new Array(256).fill(0);

                for (let i = 0; i < origPixels.length; i += 4) {
                    const rDiff = origPixels[i] - stegoPixels[i];
                    const gDiff = origPixels[i + 1] - stegoPixels[i + 1];
                    const bDiff = origPixels[i + 2] - stegoPixels[i + 2];

                    const sqErr = (rDiff * rDiff + gDiff * gDiff + bDiff * bDiff) / 3;
                    mseSum += sqErr;

                    if (sqErr > 0) alteredPixels++;
                    pov[stegoPixels[i]]++;
                }

                const mse = mseSum / totalPixels;
                const psnr = mse > 0 ? 20 * Math.log10(255 / Math.sqrt(mse)) : 999;

                // Simple Chi-Square chi2 metric over sample pairs
                let chi2 = 0;
                for (let i = 0; i < 256; i += 2) {
                    const observedPairAvg = (pov[i] + pov[i + 1]) / 2;
                    if (observedPairAvg > 0) {
                        chi2 += Math.pow(pov[i] - observedPairAvg, 2) / observedPairAvg;
                    }
                }

                const alterRate = (alteredPixels / totalPixels) * 100;
                let verdict: 'Clean' | 'Suspicious' | 'Highly Likely Embedded' = 'Clean';

                if (alterRate > 10 || chi2 < 100) verdict = 'Highly Likely Embedded';
                else if (alterRate > 0.5) verdict = 'Suspicious';

                resolve({
                    mse: Number(mse.toFixed(4)),
                    psnrOrSnr: Number(psnr.toFixed(2)),
                    metricLabel: 'Peak Signal-to-Noise Ratio (PSNR)',
                    anomalyScore: Math.min(100, Number((alterRate * 5).toFixed(1))),
                    verdict,
                    details: `Evaluated ${totalPixels.toLocaleString()} RGB pixel elements. Chi-Square ($\chi^2$) distribution variance score: ${chi2.toFixed(2)}.`,
                });
            };

            imgOrig.onload = () => { loadedCount++; if (loadedCount === 2) process(); };
            imgStego.onload = () => { loadedCount++; if (loadedCount === 2) process(); };

            imgOrig.src = URL.createObjectURL(original);
            imgStego.src = URL.createObjectURL(suspected);
        });
    };

    const handleRunAnalysis = async () => {
        if (!carrierFile || !stegoFile) {
            setError('Please upload both the original carrier and suspected stego file.');
            return;
        }

        setAnalyzing(true);
        setError(null);

        try {
            let res: AnalysisResults;
            if (mediaType === 'audio') {
                res = await analyzeAudio(carrierFile, stegoFile);
            } else {
                res = await analyzeImage(carrierFile, stegoFile);
            }
            setResults(res);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Failed to complete steganalysis processing.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="text-phos-white p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-phos-hot" /> Stegananalysis & Metrics Engine
                    </h1>
                    <p className="text-phos-dim mt-1">
                        Compare original cover media against suspected stego files to evaluate MSE, SNR/PSNR, and statistical LSB anomalies.
                    </p>
                </div>

                {/* Media Type Selection */}
                <div className="flex border-b border-phos-line gap-4">
                    <button
                        onClick={() => { setMediaType('image'); setResults(null); }}
                        className={`pb-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${mediaType === 'image'
                                ? 'border-phos-hot text-phos-hot'
                                : 'border-transparent text-phos-dim hover:text-phos-white'
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" /> Image Analysis (PNG/BMP)
                    </button>
                    <button
                        onClick={() => { setMediaType('audio'); setResults(null); }}
                        className={`pb-3 font-medium transition-colors flex items-center gap-2 border-b-2 ${mediaType === 'audio'
                                ? 'border-phos-hot text-phos-hot'
                                : 'border-transparent text-phos-dim hover:text-phos-white'
                            }`}
                    >
                        <FileAudio className="w-4 h-4" /> Audio Analysis (WAV)
                    </button>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-500/50 text-red-300 p-4 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-phos-panel border border-phos-line p-6 rounded-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Carrier Upload */}
                        <div className="space-y-2">
                            <label className="text-sm text-phos-dim font-medium">1. Original Carrier File</label>
                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-phos-line hover:border-phos/50 bg-phos-deep/50 rounded-lg cursor-pointer transition">
                                <Upload className="w-5 h-5 text-phos-dim mb-1" />
                                <span className="text-xs text-phos-dim text-center truncate max-w-full">
                                    {carrierFile ? carrierFile.name : 'Select clean file'}
                                </span>
                                <input
                                    type="file"
                                    accept={mediaType === 'image' ? 'image/png, image/bmp' : 'audio/wav'}
                                    onChange={(e) => handleFileChange(e, 'carrier')}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Stego Upload */}
                        <div className="space-y-2">
                            <label className="text-sm text-phos-dim font-medium">2. Suspected Stego File</label>
                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-phos-line hover:border-phos/50 bg-phos-deep/50 rounded-lg cursor-pointer transition">
                                <Upload className="w-5 h-5 text-phos-dim mb-1" />
                                <span className="text-xs text-phos-dim text-center truncate max-w-full">
                                    {stegoFile ? stegoFile.name : 'Select stego file'}
                                </span>
                                <input
                                    type="file"
                                    accept={mediaType === 'image' ? 'image/png, image/bmp' : 'audio/wav'}
                                    onChange={(e) => handleFileChange(e, 'stego')}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleRunAnalysis}
                        disabled={analyzing || !carrierFile || !stegoFile}
                        className="w-full bg-phos hover:bg-phos disabled:bg-phos-line disabled:text-phos-dim font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Run Stegananalysis Metrics'}
                    </button>

                    {results && (
                        <div className="bg-phos-deep border border-phos-line rounded-lg p-5 space-y-6">
                            {/* Verdict Header */}
                            <div className="flex items-center justify-between border-b border-phos-line pb-4">
                                <div>
                                    <span className="text-xs text-phos-dim font-medium uppercase tracking-wider">Analysis Verdict</span>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                                        {results.verdict === 'Clean' && <CheckCircle2 className="w-5 h-5 text-[#60A5FA]" />}
                                        {results.verdict === 'Suspicious' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                                        {results.verdict === 'Highly Likely Embedded' && <ShieldAlert className="w-5 h-5 text-red-400" />}
                                        <span className={
                                            results.verdict === 'Clean' ? 'text-[#60A5FA]' :
                                                results.verdict === 'Suspicious' ? 'text-amber-400' : 'text-red-400'
                                        }>
                                            {results.verdict}
                                        </span>
                                    </h3>
                                </div>

                                <div className="text-right">
                                    <span className="text-xs text-phos-dim font-medium uppercase tracking-wider">Anomaly Score</span>
                                    <p className="text-xl font-bold text-phos-hot">{results.anomalyScore}%</p>
                                </div>
                            </div>

                            {/* Stat Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-phos-panel border border-phos-line p-4 rounded-lg">
                                    <p className="text-xs text-phos-dim font-medium">Mean Squared Error (MSE)</p>
                                    <p className="text-2xl font-semibold text-phos-white mt-1 font-mono">{results.mse}</p>
                                    <p className="text-[11px] text-phos-dim mt-1">Lower values indicate higher signal fidelity.</p>
                                </div>

                                <div className="bg-phos-panel border border-phos-line p-4 rounded-lg">
                                    <p className="text-xs text-phos-dim font-medium">{results.metricLabel}</p>
                                    <p className="text-2xl font-semibold text-phos-white mt-1 font-mono">
                                        {results.psnrOrSnr === 999 ? '∞' : `${results.psnrOrSnr} dB`}
                                    </p>
                                    <p className="text-[11px] text-phos-dim mt-1">Values {'>'} 40 dB are visually/audibly imperceptible.</p>
                                </div>
                            </div>

                            <div className="text-xs text-phos-dim bg-phos-panel/50 p-3 rounded border border-phos-line/80 flex items-start gap-2">
                                <BarChart3 className="w-4 h-4 text-phos-hot shrink-0 mt-0.5" />
                                <span>{results.details}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}