"use client";

import { useRef, useState } from "react";
import { FileAudio, FileImage, Loader2, Upload, X } from "lucide-react";
import { ACCEPT_ATTRIBUTE, checkFile } from "@/lib/steganalysis/validation";
import { formatBytes } from "@/lib/steganalysis/format";
import type { SuspectKind } from "@/lib/steganalysis/types";

interface DropzoneProps {
  onFileAccepted: (file: File, kind: SuspectKind) => void;
  onClear: () => void;
  selected: { file: File; kind: SuspectKind } | null;
  isAnalyzing: boolean;
}

/**
 * One dropzone for both images and audio.
 *
 * Deliberately unified rather than split per media type: an analyst has a
 * suspect file, not a category, and making them choose a tab first is a step
 * that adds nothing. The kind is inferred and shown back to them.
 *
 * Validation happens here so an oversized or lossy file never reaches the
 * network — JPEG in particular is rejected with the reason, since its low bits
 * have already been destroyed by the encoder.
 */
export function Dropzone({ onFileAccepted, onClear, selected, isAnalyzing }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(file: File | undefined) {
    if (!file) return;
    const check = checkFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setError(null);
    onFileAccepted(file, check.kind);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    accept(event.dataTransfer.files[0]);
  }

  if (selected) {
    const Icon = selected.kind === "image" ? FileImage : FileAudio;
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-edge bg-surface/60 p-4">
        <span className="accent-soft accent-border accent-text flex size-11 shrink-0 items-center justify-center rounded-xl border">
          <Icon aria-hidden className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{selected.file.name}</p>
          <p className="cv-label normal-case tracking-normal">
            {selected.kind} · {formatBytes(selected.file.size)}
            {selected.file.type && ` · ${selected.file.type}`}
          </p>
        </div>

        {isAnalyzing ? (
          <span className="cv-badge border-edge bg-edge/40 text-muted">
            <Loader2 aria-hidden className="size-3 animate-spin" />
            Analysing
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              onClear();
            }}
            className="cv-btn"
          >
            <X aria-hidden className="size-3.5" />
            Choose another
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging ? "accent-border accent-soft" : "border-slate-700 bg-background/40"
        }`}
      >
        <Upload
          aria-hidden
          className={`mx-auto size-8 ${isDragging ? "accent-text" : "text-muted"}`}
        />
        <p className="mt-3 font-medium">Drop a suspect image or audio file</p>
        <p className="mt-1 text-muted">
          PNG, BMP, TIFF, WEBP, WAV, FLAC or AIFF — up to 10 MB
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="cv-btn mx-auto mt-4"
        >
          Browse files
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={(event) => {
            accept(event.target.files?.[0]);
            // Reset so re-picking the same file still fires a change event.
            event.target.value = "";
          }}
          className="sr-only"
          aria-label="Choose a file to analyse"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900/70 bg-red-950/40 px-3 py-2 text-red-400">
          {error}
        </p>
      )}

      <p className="cv-label normal-case tracking-normal">
        Files are sent to your local analysis engine and are not stored.
      </p>
    </div>
  );
}

export default Dropzone;
