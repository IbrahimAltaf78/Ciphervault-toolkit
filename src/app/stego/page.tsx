import Link from "next/link";
import {
    Shield,
    Lock,
    FileSearch,
    EyeOff,
    Sparkles,
    ChevronRight,
    Cpu,
    Type,
    Stamp,
    ExternalLink,
} from "lucide-react";

interface Module {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    badge?: string;
    color: string;
}

export default function Home() {
    const modules: Module[] = [
        {
            title: "Steganography Engine",
            description:
                "Hide encrypted text payloads inside digital images and WAV audio files using LSB and DWT techniques.",
            icon: <EyeOff className="h-6 w-6" />,
            href: "/stego",
            badge: "Core Feature",
            color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
        },
        {
            title: "Stegananalysis",
            description:
                "Detect hidden data and analyze suspect media using Chi-Square tests and pixel structural histograms.",
            icon: <FileSearch className="h-6 w-6" />,
            href: "/steganalysis",
            badge: "Forensics",
            color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
        },
        {
            title: "Cryptography Toolkit",
            description:
                "AES-256-GCM symmetric encryption, RSA key pair generation, and SHA-256 secure hashing utilities.",
            icon: <Lock className="h-6 w-6" />,
            href: "/cryptography",
            color: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30",
        },
        {
            title: "Text Hiding",
            description:
                "Manipulate zero-width characters and invisible unicode strings to conceal secret messages in plain text.",
            icon: <Type className="h-6 w-6" />,
            href: "/text-hiding",
            color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
        },
        {
            title: "Digital Watermarking",
            description:
                "Embed robust ownership markers and verify digital signatures to protect media copyright.",
            icon: <Stamp className="h-6 w-6" />,
            href: "/watermark",
            color: "from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30",
        },
        {
            title: "Encoding & Decoding",
            description:
                "Base64, Hexadecimal, Binary, and custom format conversions for forensic payload inspection.",
            icon: <Cpu className="h-6 w-6" />,
            href: "/encoding",
            color: "from-violet-500/20 to-fuchsia-500/20 text-violet-400 border-violet-500/30",
        },
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/0 blur-3xl pointer-events-none rounded-full" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                {/* Header Section */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>CipherVault Toolkit v1.0</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
                        Digital Forensics & Steganography Suite
                    </h1>

                    <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
                        Advanced detection, encryption, and covert communication tools engineered for security research and forensic analysis.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod) => (
                        <Link
                            key={mod.title}
                            href={mod.href}
                            className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className={`rounded-xl bg-gradient-to-br ${mod.color} p-3 border shadow-inner`}>
                                        {mod.icon}
                                    </div>
                                    {mod.badge && (
                                        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400 border border-cyan-500/20">
                                            {mod.badge}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2 flex items-center gap-1.5">
                                    {mod.title}
                                </h2>

                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    {mod.description}
                                </p>
                            </div>

                            <div className="flex items-center text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors pt-2 border-t border-slate-800/50">
                                <span>Launch Module</span>
                                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </main>
    );
}