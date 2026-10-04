"use client";

import { useEffect, useState } from "react";
import type { AudioSource } from "@/types";

/**
 * Shown after the user clicks "Process voice" on either the recorder or uploader.
 * This is a UI placeholder — Phase 4 will replace the fake delay with a real
 * Whisper transcription + Ollama analysis API call.
 */

interface ProcessingPlaceholderProps {
  source: AudioSource;
  onReset: () => void;
}

type Step = "transcribing" | "analysing" | "done";

const STEPS: { key: Step; label: string; detail: string }[] = [
  {
    key: "transcribing",
    label: "Transcribing with Whisper",
    detail: "Converting your speech to text…",
  },
  {
    key: "analysing",
    label: "Analysing with Ollama",
    detail: "Extracting tasks, dates, people, and topics…",
  },
  {
    key: "done",
    label: "Memory created",
    detail: "Your structured memory is ready.",
  },
];

// Simulated step durations in ms — will be replaced by real API latency
const STEP_DURATION: Record<Step, number> = {
  transcribing: 1800,
  analysing: 2200,
  done: 0,
};

function StepIndicator({ step, current }: { step: Step; current: Step }) {
  const stepOrder: Step[] = ["transcribing", "analysing", "done"];
  const stepIdx = stepOrder.indexOf(step);
  const currentIdx = stepOrder.indexOf(current);
  const isComplete = stepIdx < currentIdx;
  const isActive = stepIdx === currentIdx;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
          ${
            isComplete
              ? "bg-primary text-primary-foreground"
              : isActive
              ? "border-2 border-primary bg-accent"
              : "border-2 border-border bg-background"
          }`}
        aria-hidden="true"
      >
        {isComplete && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-primary animate-recording-dot" />
        )}
      </div>
      <div>
        <p
          className={`text-sm font-medium leading-tight ${
            isActive ? "text-foreground" : isComplete ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {STEPS.find((s) => s.key === step)?.label}
        </p>
        {isActive && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {STEPS.find((s) => s.key === step)?.detail}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProcessingPlaceholder({
  source,
  onReset,
}: ProcessingPlaceholderProps) {
  const [currentStep, setCurrentStep] = useState<Step>("transcribing");

  // Simulate the processing pipeline — replace with real API calls in Phase 4
  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStep("analysing"), STEP_DURATION.transcribing);
    const t2 = setTimeout(
      () => setCurrentStep("done"),
      STEP_DURATION.transcribing + STEP_DURATION.analysing
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isDone = currentStep === "done";

  return (
    <div
      className="w-full max-w-sm flex flex-col gap-6 animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Processing your voice note"
    >
      {/* Source info */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
          <p className="text-xs text-muted-foreground">
            {source.type === "recording" ? "Recorded audio" : "Uploaded file"}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex flex-col gap-4">
        {(["transcribing", "analysing", "done"] as Step[]).map((step) => (
          <StepIndicator key={step} step={step} current={currentStep} />
        ))}
      </div>

      {/* Done state */}
      {isDone && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Placeholder result box */}
          <div className="rounded-xl border border-primary/20 bg-accent/40 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <p className="text-sm font-semibold text-foreground">Processing complete</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In Phase 4, Whisper will transcribe your audio and Ollama will extract
              structured tasks, dates, people, and topics — then save the memory to MongoDB.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: "Tasks", value: "–", icon: "📋" },
                { label: "Dates", value: "–", icon: "📅" },
                { label: "People", value: "–", icon: "👤" },
                { label: "Topics", value: "–", icon: "🏷️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span aria-hidden="true">{icon}</span>
                  <span>{label}: <strong className="text-foreground">{value}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            id="processing-reset-btn"
            onClick={onReset}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-sm
                       text-muted-foreground hover:bg-secondary hover:text-foreground
                       transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Record or upload another
          </button>
        </div>
      )}
    </div>
  );
}
