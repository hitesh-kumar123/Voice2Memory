"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import type { UploadState, AudioSource } from "@/types";
import { UploadIcon, AudioFileIcon, TrashIcon } from "@/components/ui/icons";
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
  // Check MIME type first; fall back to extension check for browsers
  // that report "application/octet-stream" for audio files
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
  return null; // valid
}

// ─── Props ────────────────────────────────────────────────────────────────

interface UploadAudioProps {
  /** Called when the user clicks "Process voice". Connect to Whisper API in Phase 4. */
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

      // Revoke any previously created object URL
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
      // Reset input value so the same file can be re-selected if cleared
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
    <div className="w-full max-w-sm flex flex-col gap-4">

      {/* Hidden file input — always rendered for ref access */}
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
            "relative flex flex-col items-center justify-center gap-3",
            "py-12 px-6 rounded-xl border-2 border-dashed cursor-pointer",
            "transition-all duration-200 text-center select-none",
            isDragging
              ? "border-primary bg-accent/60 scale-[1.015]"
              : "border-border hover:border-primary/50 hover:bg-secondary",
          ].join(" ")}
        >
          <div
            className={[
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
              isDragging ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
            ].join(" ")}
            aria-hidden="true"
          >
            <UploadIcon className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Drop it here" : "Drag & drop your audio file"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or{" "}
              <span className="text-primary font-medium underline underline-offset-2">
                browse files
              </span>
            </p>
          </div>

          <p className="text-xs text-muted-foreground/70">{ACCEPTED_LABEL} · Max {MAX_SIZE_MB} MB</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div role="alert" className="flex items-start gap-2 animate-fade-in">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-destructive shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-destructive leading-snug">{error}</p>
        </div>
      )}

      {/* Selected state */}
      {state === "selected" && audioSource && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* File info row */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary">
            <div
              className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <AudioFileIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" title={audioSource.name}>
                {audioSource.name}
              </p>
              <p className="text-xs text-muted-foreground">{formatBytes(audioSource.size)}</p>
            </div>
            <button
              type="button"
              id="upload-clear-btn"
              onClick={clearFile}
              aria-label={`Remove ${audioSource.name}`}
              className="p-1.5 rounded-md text-muted-foreground
                         hover:text-destructive hover:bg-destructive/10
                         transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Audio preview */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview
            </p>
            <audio
              controls
              src={audioSource.objectUrl}
              className="w-full rounded-lg"
              aria-label={`Audio preview: ${audioSource.name}`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              id="upload-change-btn"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2.5 rounded-lg border border-border text-sm
                         text-muted-foreground hover:bg-secondary hover:text-foreground
                         transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            >
              Change file
            </button>
            <button
              type="button"
              id="upload-process-btn"
              onClick={handleProcess}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground
                         text-sm font-medium
                         hover:opacity-90 active:scale-95
                         transition-all duration-150
                         focus-visible:ring-2 focus-visible:ring-ring"
            >
              Process voice →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
