import React from 'react';
import ImageStegoUI from '@/components/ImageStegoUI';

export default function DctDwtSteganographyPage() {
    return (
        <main className="min-h-screen bg-phos-deep p-6 md:p-10">
            <ImageStegoUI initialAlgorithm="dwt" />
        </main>
    );
}