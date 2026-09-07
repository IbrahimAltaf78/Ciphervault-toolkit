import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileSearch,
  EyeOff,
  Sparkles,
  ChevronRight,
  Cpu,
  Layers,
} from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

function ModuleCard({ title, description, icon, href, badge }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="rounded-lg bg-cyan-500/10 p-3 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
            {icon}
          </div>
          {badge && (
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400 border border-cyan-500/20">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {description}
        </p>
      </div>
      <div className="flex items-center text-sm font-semibold text-cyan-400 group-hover:text-cyan-300">
        <span>Launch Module</span>
        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function Home() {
  const modules: ModuleCardProps[] = [
    {
      title: "Steganography Engine",
      description:
        "Hide encrypted text messages and secret payloads inside images, audio files, and digital media.",
      icon: <EyeOff className="h-6 w-6" />,
      href: "/stego/image",
      badge: "Core",
    },
    {
      title: "Stegananalysis",
      description:
        "Analyze suspect media with Chi-Square test algorithms and structural histogram checks to detect hidden data.",
      icon: <FileSearch className="h-6 w-6" />,
      href: "/steganalysis",
      badge: "Detection",
    },
    {
      title: "Cryptography Toolkit",
      description:
        "AES-256 encryption, RSA key pair generation, and secure hashing utilities for data protection.",
      icon: <Lock className="h-6 w-6" />,
      href: "/cryptography",
    },
    {
      title: "Text Hiding",
      description:
        "Zero-width character manipulation and invisible text embedding mechanisms.",
      icon: <Layers className="h-6 w-6" />,
      href: "/text-hiding",
    },
    {
      title: "Digital Watermarking",
      description:
        "Embed robust ownership markers and verify copyright signatures on media assets.",
      icon: <ShieldCheck className="h-6 w-6" />,
      href: "/watermark",
    },
    {
      title: "Encoding & Decoding",
      description:
        "Base64, Hex, Binary, and custom format conversions for forensic payload analysis.",
      icon: <Cpu className="h-6 w-6" />,
      href: "/encoding",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CipherVault Toolkit v1.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Digital Forensic & Steganography Suite
          </h1>
          <p className="text-lg text-slate-400">
            Advanced detection, encryption, and covert communication tools engineered for security research and forensic analysis.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </div>
      </div>
    </main>
  );
}