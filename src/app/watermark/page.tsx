import Link from "next/link";

export default function WatermarkHub() {
    const tools = [
        { title: "Visible Watermarking", href: "/watermark/visible", desc: "Overlay text or logos with custom opacity." },
        { title: "Invisible Watermarking", href: "/watermark/invisible", desc: "Embed micro-signatures in spatial image planes." },
        { title: "Fragile Watermarking", href: "/watermark/fragile", desc: "SHA-256 canvas integrity checking." },
        { title: "Robust Watermarking", href: "/watermark/robust", desc: "DCT-domain signatures surviving compression." },
    ];

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Digital Watermarking Suite</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((t) => (
                    <Link key={t.href} href={t.href} className="p-6 bg-phos-panel border border-phos-line rounded-xl hover:border-phos transition">
                        <h2 className="text-xl font-semibold text-phos-hot mb-2">{t.title}</h2>
                        <p className="text-phos-dim text-sm">{t.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}