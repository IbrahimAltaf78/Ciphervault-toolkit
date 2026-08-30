'use client';

import { useState } from 'react';

export default function VideoStegoPage() {
    const [mode, setMode] = useState<'hide' | 'extract'>('hide');
    const [file, setFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const [secretText, setSecretText] = useState('');
    const [extractedText, setExtractedText] = useState('');

    const [loading, setLoading] = useState(false);
    const [stegoVideoUrl, setStegoVideoUrl] = useState<string | null>(null);
    const [stegoFileName, setStegoFileName] = useState<string>('stego_video.avi');

    // Handle file selection and generate a preview URL
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setVideoPreview(URL.createObjectURL(selectedFile));

            // Reset states on new file
            setExtractedText('');
            setStegoVideoUrl(null);
        }
    };

    // Connect to the backend /hide endpoint
    const handleHide = async () => {
        if (!file || !secretText) return alert('Please provide a video file and secret text.');

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', secretText);

        try {
            const response = await fetch('http://localhost:8000/api/stego/video/hide', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to encode video');
            }

            // Extract the filename from headers if possible, or default to .avi
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = file.name.split('.')[0] + '_stego.avi';
            if (contentDisposition && contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }
            setStegoFileName(filename);

            // The backend returns a raw AVI file blob
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setStegoVideoUrl(url);
        } catch (error: any) {
            console.error(error);
            alert(`Error encoding video: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Connect to the backend /extract endpoint
    const handleExtract = async () => {
        if (!file) return alert('Please provide a stego .avi file.');

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/stego/video/extract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to extract data');
            }

            const data = await response.json();
            setExtractedText(data.extracted_text);
        } catch (error: any) {
            console.error(error);
            alert(`Error extracting text: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Video Steganography</h1>
            <p className="text-gray-600 dark:text-gray-300">Hide and extract secret text inside video files.</p>

            {/* Mode Toggles */}
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button
                    className={`flex-1 py-2 rounded-md font-medium transition-colors ${mode === 'hide' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setMode('hide')}
                >
                    Hide Data (.mp4)
                </button>
                <button
                    className={`flex-1 py-2 rounded-md font-medium transition-colors ${mode === 'extract' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setMode('extract')}
                >
                    Extract Data (.avi)
                </button>
            </div>

            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                {/* File Dropzone / Input */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm">
                        {mode === 'hide' ? 'Upload Original Video (.mp4, .avi)' : 'Upload Stego Video (.avi)'}
                    </label>
                    <input
                        type="file"
                        accept={mode === 'hide' ? "video/mp4,video/avi,video/x-msvideo" : "video/avi,video/x-msvideo"}
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* Video Preview Player (Only for formats browsers support well, like MP4) */}
                {videoPreview && mode === 'hide' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Original Video Preview:</p>
                        <video controls src={videoPreview} className="w-full max-h-64 object-contain rounded bg-black" />
                    </div>
                )}

                {/* Dynamic Fields based on Mode */}
                {mode === 'hide' ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-sm">Secret Text to Hide</label>
                            <textarea
                                rows={4}
                                value={secretText}
                                onChange={(e) => setSecretText(e.target.value)}
                                placeholder="Enter the secret message here..."
                                className="w-full p-3 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>

                        <button
                            onClick={handleHide}
                            disabled={loading || !file || !secretText}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Processing Video (This may take a moment)...' : 'Hide Text into Video'}
                        </button>

                        {stegoVideoUrl && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-4 text-center">
                                <p className="font-semibold text-green-700 dark:text-green-400">
                                    Success! Your data is hidden.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    (Note: Stego videos are saved as lossless .avi to protect hidden data. Browsers cannot preview this format.)
                                </p>
                                <a
                                    href={stegoVideoUrl}
                                    download={stegoFileName}
                                    className="inline-block px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors"
                                >
                                    Download {stegoFileName}
                                </a>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleExtract}
                            disabled={loading || !file}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Analyzing Video Frames...' : 'Extract Hidden Text'}
                        </button>

                        {extractedText && (
                            <div className="flex flex-col gap-2 mt-4">
                                <label className="font-semibold text-sm text-green-600">Extracted Secret Text:</label>
                                <textarea
                                    readOnly
                                    value={extractedText}
                                    rows={4}
                                    className="w-full p-3 border-2 border-green-500 bg-green-50 rounded-md dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}