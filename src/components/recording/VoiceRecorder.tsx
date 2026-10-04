"use client";

import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from "react";
import type { RecordingState, RecordingError, AudioSource } from "@/types";
import { MicIcon, StopIcon, TrashIcon } from "@/components/ui/icons";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TranscriptView from "@/components/recording/TranscriptView";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Map a RecordingError to a user-facing message + action hint */
const ERROR_MESSAGES: Record<RecordingError, { title: string; hint: string }> = {
  "permission-denied": {
    title: "Microphone access denied",
    hint: "Click the lock icon in your browser's address bar and allow microphone access, then try again.",
  },
  "not-supported": {
    title: "Recording not supported",
    hint: "Your browser doesn't support audio recording. Try Chrome, Edge, or Firefox.",
  },
  "no-device": {
    title: "No microphone found",
    hint: "Make sure a microphone is connected and not being used by another app.",
  },
  "record-failed": {
    title: "Recording failed",
    hint: "Something went wrong while capturing audio. Please try again.",
  },
  unknown: {
    title: "Something went wrong",
    hint: "An unexpected error occurred. Please try again.",
  },
};

/** Detect whether MediaRecorder is available in this browser */
function isBrowserSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Classify a getUserMedia / MediaRecorder error into our error type */
function classifyError(err: unknown): RecordingError {
  if (!(err instanceof Error)) return "unknown";
  const name = err.name;
  const message = err.message.toLowerCase();
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "permission-denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "no-device";
  if (name === "NotSupportedError" || message.includes("not supported")) return "not-supported";
  return "unknown";
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ErrorBanner({
  error,
  onDismiss,
}: {
  error: RecordingError;
  onDismiss: () => void;
}) {
  const { title, hint } = ERROR_MESSAGES[error];
  return (
    <div
      role="alert"
      className="w-full max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-2 animate-fade-in"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-destructive">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-medium text-primary hover:underline underline-offset-2 text-left"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

interface VoiceRecorderProps {
  onProcess?: (source: AudioSource) => void;
}

export default function VoiceRecorder({ onProcess }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<RecordingError | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const isMounted = useIsMounted();
  const supported = isMounted ? isBrowserSupported() : null;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioSource?.objectUrl) URL.revokeObjectURL(audioSource.objectUrl);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [audioSource]);

  const startRecording = useCallback(async () => {
    if (!supported) {
      setError("not-supported");
      setState("error");
      return;
    }

    setState("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        const objectUrl = URL.createObjectURL(finalBlob);
        const source: AudioSource = {
          type: "recording",
          blob: finalBlob,
          name: `Recording ${new Date().toLocaleTimeString()}`,
          size: finalBlob.size,
          objectUrl,
        };
        setAudioSource(source);
        setState("done");
        // Release the mic
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = () => {
        setError("record-failed");
        setState("error");
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start(250);
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const classified = classifyError(err);
      setError(classified);
      setState("error");
    }
  }, [supported]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping recorder:", err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  const reset = useCallback(() => {
    if (audioSource?.objectUrl) URL.revokeObjectURL(audioSource.objectUrl);
    setAudioSource(null);
    setElapsed(0);
    setError(null);
    setState("idle");
  }, [audioSource]);

  const handleProcess = useCallback(() => {
    if (!audioSource) return;
    setState("processing");
    onProcess?.(audioSource);
  }, [audioSource, onProcess]);

  // ── Render: loading (waiting for hydration / browser check) ─────────────
  if (supported === null) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center py-8">
        <LoadingSpinner size="md" label="Checking browser support…" />
      </div>
    );
  }

  // ── Render: browser not supported ──────────────────────────────────────
  if (!supported) {
    return (
      <div
        role="alert"
        className="w-full max-w-sm rounded-xl border border-border bg-secondary p-6 text-center flex flex-col gap-3"
      >
        <p className="text-sm font-semibold text-foreground">Recording not available</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your browser doesn&apos;t support audio recording. Try Chrome, Firefox, or Edge, or
          use the upload option below.
        </p>
      </div>
    );
  }

  // ── Render: live Whisper transcription ──────────────────────────────
  if (state === "processing" && audioSource) {
    return <TranscriptView source={audioSource} onReset={reset} />;
  }

  // ── Render: main recorder ───────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-sm">
      {/* Button ring area */}
      <div className="relative flex items-center justify-center" aria-live="polite">
        {/* Pulse rings — recording only — pointer-events-none ensures it NEVER blocks clicks */}
        {state === "recording" && (
          <>
            <div
              className="absolute w-36 h-36 rounded-full border-2 border-destructive/30 animate-pulse-ring pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute w-52 h-52 rounded-full border border-destructive/15 animate-pulse-ring delay-300 pointer-events-none"
              aria-hidden="true"
            />
          </>
        )}

        {/* Idle */}
        {(state === "idle" || state === "error") && (
          <button
            id="recorder-start-btn"
            type="button"
            onClick={startRecording}
            aria-label="Start recording"
            className="relative z-20 w-24 h-24 rounded-full bg-primary text-primary-foreground
                       flex items-center justify-center shadow-md cursor-pointer
                       hover:opacity-90 hover:shadow-lg active:scale-95
                       transition-all duration-200
                       focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MicIcon className="w-10 h-10" />
          </button>
        )}

        {/* Requesting permission */}
        {state === "requesting" && (
          <div
            className="relative z-20 w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40
                       flex items-center justify-center"
            aria-label="Requesting microphone permission"
          >
            <LoadingSpinner size="md" label="Requesting microphone access" />
          </div>
        )}

        {/* Recording — Large Clickable Stop Button */}
        {state === "recording" && (
          <button
            id="recorder-stop-btn"
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="relative z-20 w-24 h-24 rounded-full bg-destructive text-white
                       flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer
                       hover:opacity-95 hover:scale-105 active:scale-95
                       transition-all duration-150 animate-pulse
                       focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <StopIcon className="w-9 h-9" />
          </button>
        )}

        {/* Done */}
        {state === "done" && (
          <div
            className="relative z-20 w-24 h-24 rounded-full bg-accent border-2 border-primary/20
                       flex items-center justify-center"
            aria-label="Recording complete"
          >
            <MicIcon className="w-10 h-10 text-primary" />
          </div>
        )}
      </div>

      {/* Status label / Stop Action Helper */}
      <div
        className="flex flex-col items-center gap-1 min-h-[2rem]"
        aria-live="polite"
        aria-atomic="true"
      >
        {state === "idle" && (
          <p className="text-sm text-muted-foreground">
            Tap microphone to start recording
          </p>
        )}

        {state === "requesting" && (
          <p className="text-sm text-muted-foreground">Waiting for mic permission…</p>
        )}

        {state === "recording" && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full bg-destructive animate-recording-dot"
                aria-hidden="true"
              />
              <span
                className="text-sm font-mono tabular-nums font-semibold text-foreground"
                aria-label={`Recording time: ${formatTime(elapsed)}`}
              >
                {formatTime(elapsed)}
              </span>
              <span className="text-sm text-muted-foreground">Recording…</span>
            </div>

            {/* Direct text stop button */}
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              ⏹ Tap here to finish recording
            </button>
          </div>
        )}

        {state === "done" && (
          <p className="text-sm text-muted-foreground">
            {audioSource ? `${formatBytes(audioSource.size)} · ${formatTime(elapsed)}` : "Recording complete"}
          </p>
        )}
      </div>

      {/* Error banner */}
      {state === "error" && error && (
        <ErrorBanner error={error} onDismiss={reset} />
      )}

      {/* Playback + actions — shown after recording */}
      {state === "done" && audioSource && (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
          {/* Audio preview */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Audio Preview
            </p>
            <audio
              controls
              src={audioSource.objectUrl}
              className="w-full rounded-lg"
              aria-label="Your recording preview"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              id="recorder-delete-btn"
              type="button"
              onClick={reset}
              aria-label="Delete recording and start over"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg
                         border border-border text-sm text-muted-foreground
                         hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30
                         transition-colors focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>

            <button
              id="recorder-process-btn"
              type="button"
              onClick={handleProcess}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground
                         text-sm font-semibold shadow-sm
                         hover:opacity-90 active:scale-95
                         transition-all duration-150 cursor-pointer
                         focus-visible:ring-2 focus-visible:ring-ring"
            >
              Process voice with Gemma 2 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
