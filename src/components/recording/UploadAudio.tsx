"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import type { UploadState, AudioSource } from "@/types";
import {
  UploadIcon,
  AudioFileIcon,
  TrashIcon,
  AlertIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import TranscriptView from "@/components/recording/TranscriptView";

// ─── Constants ────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = new Set([
  "audio/mpeg",       // .mp3
  "audio/mp3",        // some browsers report this
  "audio/wav",        // .wav
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",        // .m4a
  "audio/x-m4a",
  "audio/webm",       // .webm
  "audio/ogg",        // .ogg
  "audio/flac",       // .flac
]);

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.webm,.ogg,.flac";
const ACCEPTED_LABEL = "MP3 · WAV · M4A · WebM · OGG · FLAC";
const MAX_SIZE_MB = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidAudioFile(file: File): string | null {
  const mimeOk = ACCEPTED_MIME_TYPES.has(file.type);
  const extOk = /\.(mp3|wav|m4a|webm|ogg|flac)$/i.test(file.name);

  if (!mimeOk && !extOk) {
    return `Unsupported format. Please upload ${ACCEPTED_LABEL}.`;
  }
  if (file.size === 0) {
    return "The file appears to be empty. Please choose a valid audio file.";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────

interface UploadAudioProps {
  onProcess?: (source: AudioSource) => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function UploadAudio({ onProcess }: UploadAudioProps) {
  const [state, setState] = useState<UploadState>("empty");
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = useCallback(
    (file: File) => {
      setError(null);

      const validationError = isValidAudioFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setAudioSource((prev) => {
        if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        return null;
      });

      const objectUrl = URL.createObjectURL(file);
      const source: AudioSource = {
        type: "upload",
        blob: file,
        name: file.name,
        size: file.size,
        objectUrl,
      };
      setAudioSource(source);
      setState("selected");
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) selectFile(file);
      e.target.value = "";
    },
    [selectFile]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) selectFile(file);
    },
    [selectFile]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const clearFile = useCallback(() => {
    setAudioSource((prev) => {
      if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setError(null);
    setState("empty");
  }, []);

  const handleProcess = useCallback(() => {
    if (!audioSource) return;
    setState("processing");
    onProcess?.(audioSource);
  }, [audioSource, onProcess]);

  // ── Processing state ──────────────────────────────────────────────────
  if (state === "processing" && audioSource) {
    return <TranscriptView source={audioSource} onReset={clearFile} />;
  }

  // ── Main UI ───────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
        id="audio-file-input"
        tabIndex={-1}
      />

      {/* Dropzone — empty state */}
      {state === "empty" && (
        <div
          id="upload-dropzone"
          role="button"
          tabIndex={0}
          aria-label="Upload audio file — click or drag and drop"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnter={handleDragEnter}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={[
            "relative flex flex-col items-center justify-center gap-3.5",
            "py-12 px-6 rounded-2xl border-2 border-dashed cursor-pointer",
            "transition-all duration-200 text-center select-none bg-card/60 backdrop-blur-xs",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/80 hover:border-primary/50 hover:bg-secondary/40",
          ].join(" ")}
        >
          <div
            className={[
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors border",
              isDragging
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary text-muted-foreground border-border/50",
            ].join(" ")}
            aria-hidden="true"
          >
            <UploadIcon className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              {isDragging ? "Drop audio file to process" : "Drag and drop your audio note"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or{" "}
              <span className="text-primary font-medium underline underline-offset-4">
                browse local files
              </span>
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground/70 font-mono tracking-tight">{ACCEPTED_LABEL} · Max {MAX_SIZE_MB} MB</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div role="alert" className="flex items-center gap-2 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive animate-fade-in text-xs font-medium">
          <AlertIcon className="w-4 h-4 shrink-0" />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      {/* Selected state */}
      {state === "selected" && audioSource && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* File info row */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/80 bg-card">
            <div
              className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20"
              aria-hidden="true"
            >
              <AudioFileIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate" title={audioSource.name}>
                {audioSource.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{formatBytes(audioSource.size)}</p>
            </div>
            <button
              type="button"
              id="upload-clear-btn"
              onClick={clearFile}
              aria-label={`Remove ${audioSource.name}`}
              className="p-2 rounded-lg text-muted-foreground
                         hover:text-destructive hover:bg-destructive/10
                         transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Audio preview */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/60 bg-secondary/20">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Audio Waveform Preview
            </p>
            <audio
              controls
              src={audioSource.objectUrl}
              className="w-full h-9 rounded-lg"
              aria-label={`Audio preview: ${audioSource.name}`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              id="upload-change-btn"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl border border-border text-sm
                         text-muted-foreground hover:bg-secondary hover:text-foreground
                         transition-colors font-medium"
            >
              Choose different file
            </button>
            <button
              type="button"
              id="upload-process-btn"
              onClick={handleProcess}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground
                         text-sm font-semibold shadow-sm
                         hover:opacity-90 active:scale-98
                         transition-all duration-150 flex items-center justify-center gap-2"
            >
              <span>Process with Gemma 2</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
