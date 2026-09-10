import React from 'react';
import ImageStegoUI from '@/components/ImageStegoUI';

export default function DctDwtSteganographyPage() {
    return (
        <main className="p-6 md:p-10">
            <ImageStegoUI initialAlgorithm="dwt" />
        </main>
    );
}