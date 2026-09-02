'use client';

import React, { useRef, useEffect } from 'react';

interface AudioWaveformProps {
    fileOrUrl: File | string | null;
    height?: number;
    waveColor?: string;
    backgroundColor?: string;
}

export default function AudioWaveform({
    fileOrUrl,
    height = 96,
    waveColor = '#22d3ee', // Tailwind cyan-400
    backgroundColor = '#020617', // Tailwind slate-950
}: AudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!fileOrUrl || !canvasRef.current) return;

        let animationFrameId: number;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderWaveform = async () => {
            try {
                // Step 1: Get ArrayBuffer from File or URL fetch
                let arrayBuffer: ArrayBuffer;
                if (typeof fileOrUrl === 'string') {
                    const response = await fetch(fileOrUrl);
                    arrayBuffer = await response.arrayBuffer();
                } else {
                    arrayBuffer = await fileOrUrl.arrayBuffer();
                }

                // Step 2: Decode Audio Data using Web Audio API
                const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                // Extract channel data (mono/left channel)
                const channelData = audioBuffer.getChannelData(0);

                // Step 3: Resize canvas resolution for sharp rendering
                const dpr = window.devicePixelRatio || 1;
                canvas.width = canvas.offsetWidth * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);

                const width = canvas.offsetWidth;
                const amp = height / 2;

                // Clear Canvas
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);

                // Step 4: Downsample peaks for canvas width
                const step = Math.ceil(channelData.length / width);
                ctx.lineWidth = 2;
                ctx.strokeStyle = waveColor;
                ctx.beginPath();

                for (let i = 0; i < width; i++) {
                    let min = 1.0;
                    let max = -1.0;

                    for (let j = 0; j < step; j++) {
                        const datum = channelData[i * step + j];
                        if (datum < min) min = datum;
                        if (datum > max) max = datum;
                    }

                    const x = i;
                    const yMin = (1 + min) * amp;
                    const yMax = (1 + max) * amp;

                    ctx.moveTo(x, yMin);
                    ctx.lineTo(x, yMax);
                }

                ctx.stroke();

                // Close AudioContext to release memory
                await audioCtx.close();
            } catch (err) {
                console.error('Failed to render audio waveform:', err);
            }
        };

        animationFrameId = requestAnimationFrame(() => {
            renderWaveform();
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [fileOrUrl, height, waveColor, backgroundColor]);

    if (!fileOrUrl) return null;

    return (
        <div className="w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2">
            <canvas
                ref={canvasRef}
                style={{ height: `${height}px` }}
                className="w-full block"
            />
        </div>
    );
}