import ImageStegoUI from '@/components/ImageStegoUI';

export default function LsbSteganographyPage() {
    return (
        <main className="min-h-screen bg-slate-950 p-8">
            <ImageStegoUI initialAlgorithm="lsb" />
        </main>
    );
}