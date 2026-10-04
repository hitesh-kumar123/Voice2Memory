"use client";

import { useEffect, useState } from "react";
import type { AudioSource } from "@/types";
import {
  MicIcon,
  AudioFileIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  CalendarIcon,
  UsersIcon,
  TagIcon,
  CheckIcon,
} from "@/components/ui/icons";

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
    label: "Analysing with Google Gemma 2",
    detail: "Extracting tasks, dates, people, and topics…",
  },
  {
    key: "done",
    label: "Memory created",
    detail: "Your structured memory is ready.",
  },
];

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
        {isComplete && <CheckIcon className="w-3.5 h-3.5" />}
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/60 border border-border/70">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
          {source.type === "recording" ? (
            <MicIcon className="w-4 h-4" />
          ) : (
            <AudioFileIcon className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
          <p className="text-xs text-muted-foreground">
            {source.type === "recording" ? "Recorded audio" : "Uploaded audio file"}
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
          {/* Result box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-foreground">Processing complete</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Whisper transcribed your audio and Google Gemma 2 extracted
              structured tasks, dates, people, and topics — saving directly to MongoDB Atlas.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: "Tasks", value: "–", icon: CheckSquareIcon },
                { label: "Dates", value: "–", icon: CalendarIcon },
                { label: "People", value: "–", icon: UsersIcon },
                { label: "Topics", value: "–", icon: TagIcon },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary opacity-80" />
                  <span>{label}: <strong className="text-foreground">{value}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            id="processing-reset-btn"
            onClick={onReset}
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm
                       text-muted-foreground hover:bg-secondary hover:text-foreground
                       transition-colors focus-visible:ring-2 focus-visible:ring-ring font-medium"
          >
            Record or upload another
          </button>
        </div>
      )}
    </div>
  );
}
