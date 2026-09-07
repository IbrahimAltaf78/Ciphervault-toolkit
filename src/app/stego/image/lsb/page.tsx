import React from 'react';
import ImageStegoUI from '@/components/ImageStegoUI';

export default function LsbSteganographyPage() {
    return (
        <main className="min-h-screen bg-slate-950 p-6 md:p-10">
            <ImageStegoUI initialAlgorithm="lsb" />
        </main>
    );
}