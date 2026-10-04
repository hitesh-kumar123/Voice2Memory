"use client";

import { useEffect, useState } from "react";
import type { AudioSource, TranscriptResult, AnalysisResult } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StructuredMemoryResult from "@/components/recording/StructuredMemoryResult";

interface TranscriptViewProps {
  source: AudioSource;
  onReset: () => void;
}

type PipelineStage =
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "ready"
  | "error-transcription"
  | "error-analysis";

export default function TranscriptView({ source, onReset }: TranscriptViewProps) {
  const [stage, setStage] = useState<PipelineStage>("uploading");
  const [transcriptData, setTranscriptData] = useState<TranscriptResult | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryTranscriptionCount, setRetryTranscriptionCount] = useState(0);

  // Save memory state (Phase 6 integration)
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 1. Transcription step
  useEffect(() => {
    let isCancelled = false;

    async function runTranscription() {
      setStage("uploading");
      setErrorMessage(null);
      setTranscriptData(null);
      setAnalysisData(null);

      try {
        const formData = new FormData();
        const ext = source.type === "recording" ? "webm" : source.name.split(".").pop() || "wav";
        const fileName = source.name.includes(".") ? source.name : `${source.name}.${ext}`;
        formData.append("audio", source.blob, fileName);

        const uploadTimer = setTimeout(() => {
          if (!isCancelled) setStage("transcribing");
        }, 300);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        clearTimeout(uploadTimer);
        const data: TranscriptResult = await response.json();

        if (isCancelled) return;

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to transcribe audio.");
        }

        setTranscriptData(data);

        // If transcript is empty or non-speech, we still proceed with empty analysis
        if (!data.transcript?.trim()) {
          setAnalysisData({
            success: true,
            title: "Empty Voice Note",
            summary: "No recognizable speech was detected in this recording.",
            tasks: [],
            dates: [],
            importantDates: [],
            people: [],
            topics: ["General"],
          });
          setStage("ready");
          return;
        }

        // Proceed to LLM analysis
        setStage("analyzing");
        await runAnalysis(data.transcript);
      } catch (err: unknown) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : "Transcription failed.";
        setErrorMessage(msg);
        setStage("error-transcription");
      }
    }

    async function runAnalysis(transcriptText: string) {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcriptText }),
        });

        const analysis: AnalysisResult = await res.json();

        if (isCancelled) return;

        if (!res.ok || !analysis.success) {
          throw new Error(analysis.error || "Failed to extract structured memory.");
        }

        setAnalysisData(analysis);
        setStage("ready");
      } catch (err: unknown) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : "AI analysis failed.";
        setErrorMessage(msg);
        setStage("error-analysis");
      }
    }

    runTranscription();

    return () => {
      isCancelled = true;
    };
  }, [source, retryTranscriptionCount]);

  // Separate handler to retry AI analysis without re-uploading or re-transcribing
  const handleRetryAnalysis = async () => {
    if (!transcriptData?.transcript) return;
    setStage("analyzing");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptData.transcript }),
      });

      const analysis: AnalysisResult = await res.json();

      if (!res.ok || !analysis.success) {
        throw new Error(analysis.error || "Failed to extract structured memory.");
      }

      setAnalysisData(analysis);
      setStage("ready");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI analysis failed.";
      setErrorMessage(msg);
      setStage("error-analysis");
    }
  };

  // Save to MongoDB (Phase 6)
  const handleSaveMemory = async () => {
    if (!analysisData || !transcriptData) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: analysisData.title,
          summary: analysisData.summary,
          transcript: transcriptData.transcript,
          tasks: analysisData.tasks,
          dates: analysisData.dates || analysisData.importantDates,
          importantDates: analysisData.importantDates || analysisData.dates,
          people: analysisData.people,
          topics: analysisData.topics,
          audioFileName: source.name,
          audioDuration: transcriptData.duration,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save memory to database.");
      }

      setIsSaved(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save memory.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render: Progress States ──────────────────────────────────────────────
  if (stage === "uploading" || stage === "transcribing" || stage === "analyzing") {
    const stageDetails = {
      uploading: {
        title: "Uploading audio…",
        desc: "Preparing voice note for speech-to-text processing.",
      },
      transcribing: {
        title: "Transcribing with Whisper…",
        desc: "Running local Whisper AI model to generate high-accuracy transcript.",
      },
      analyzing: {
        title: "Structuring with Google Gemma 2…",
        desc: "Running open-weight Gemma 2 model to extract actionable tasks, dates, people, and topics.",
      },
    }[stage];

    return (
      <div
        className="w-full max-w-md flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-border bg-card shadow-sm text-center gap-5 animate-fade-in"
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner size="lg" label={stageDetails.title} />

        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-foreground">
            {stageDetails.title}
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {stageDetails.desc}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 pt-2 text-[11px] font-medium text-muted-foreground">
          <span className={stage === "uploading" ? "text-primary font-bold" : "text-muted-foreground/60"}>
            1. Upload
          </span>
          <span>→</span>
          <span className={stage === "transcribing" ? "text-primary font-bold" : "text-muted-foreground/60"}>
            2. Transcribe
          </span>
          <span>→</span>
          <span className={stage === "analyzing" ? "text-primary font-bold" : "text-muted-foreground/60"}>
            3. Structure
          </span>
        </div>
      </div>
    );
  }

  // ── Render: Error States ────────────────────────────────────────────────
  if (stage === "error-transcription" || stage === "error-analysis") {
    const isAnalysisError = stage === "error-analysis";

    return (
      <div
        role="alert"
        className="w-full max-w-md flex flex-col gap-4 p-5 rounded-2xl border border-destructive/30 bg-destructive/5 animate-fade-in"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">
              {isAnalysisError ? "AI Analysis failed" : "Transcription failed"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {errorMessage || "An unexpected error occurred during processing."}
            </p>
          </div>
        </div>

        {/* If analysis failed, show that transcript was preserved */}
        {isAnalysisError && transcriptData?.transcript && (
          <div className="p-3 rounded-lg bg-background border border-border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Preserved Transcript:</span>
            <p className="mt-1 line-clamp-2">{transcriptData.transcript}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {isAnalysisError ? (
            <button
              type="button"
              onClick={handleRetryAnalysis}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Retry AI analysis
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRetryTranscriptionCount((c) => c + 1)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Retry transcription
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Structured Memory Ready ─────────────────────────────────────
  if (stage === "ready" && transcriptData && analysisData) {
    return (
      <StructuredMemoryResult
        source={source}
        transcriptData={transcriptData}
        analysisData={analysisData}
        onReset={onReset}
        onRetryAnalysis={handleRetryAnalysis}
        onSave={handleSaveMemory}
        isSaving={isSaving}
        isSaved={isSaved}
        saveError={saveError}
      />
    );
  }

  return null;
}
