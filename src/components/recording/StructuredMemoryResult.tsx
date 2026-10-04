"use client";

import { useState } from "react";
import type { AudioSource, AnalysisResult, TranscriptResult } from "@/types";
import VoiceSummaryPlayer from "@/components/ui/VoiceSummaryPlayer";

interface StructuredMemoryResultProps {
  source: AudioSource;
  transcriptData: TranscriptResult;
  analysisData: AnalysisResult;
  onReset: () => void;
  onRetryAnalysis?: () => void;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
  isSaved?: boolean;
  saveError?: string | null;
}

export default function StructuredMemoryResult({
  source,
  transcriptData,
  analysisData,
  onReset,
  onSave,
  isSaving = false,
  isSaved = false,
  saveError = null,
}: StructuredMemoryResultProps) {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});

  const handleCopySummary = async () => {
    if (!analysisData.summary) return;
    try {
      await navigator.clipboard.writeText(analysisData.summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyTranscript = async () => {
    if (!transcriptData.transcript) return;
    try {
      await navigator.clipboard.writeText(transcriptData.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExportMarkdown = async () => {
    const datesList = analysisData.importantDates || analysisData.dates || [];
    const md = `# ${analysisData.title || "Voice Memory"}

**Extracted with:** Google Gemma 2 (Open-Weight AI) & OpenAI Whisper
**Date:** ${new Date().toLocaleDateString()}

## 📝 Summary
${analysisData.summary}

## ✅ Actionable Tasks
${
  analysisData.tasks && analysisData.tasks.length > 0
    ? analysisData.tasks.map((t) => `- [ ] ${t}`).join("\n")
    : "_No actionable tasks detected._"
}

## 📅 Important Dates & Times
${
  datesList.length > 0
    ? datesList.map((d) => `- ${d}`).join("\n")
    : "_None mentioned._"
}

## 👤 People Mentioned
${
  analysisData.people && analysisData.people.length > 0
    ? analysisData.people.map((p) => `- ${p}`).join("\n")
    : "_None mentioned._"
}

## 🎙️ Full Transcript
> ${transcriptData.transcript}
`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      // Fallback
    }
  };

  const toggleTask = (index: number) => {
    setCheckedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const datesList = analysisData.importantDates || analysisData.dates || [];
  const modelBadge = analysisData.modelUsed || "Google Gemma 2 (2B)";

  return (
    <div
      className="w-full max-w-2xl flex flex-col gap-6 animate-fade-in"
      role="region"
      aria-label="Structured memory analysis result"
    >
      {/* Header bar with Status, Gemma 2 Badge & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/80 border border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold"
            aria-hidden="true"
          >
            ✨
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Memory Extracted
              </span>
            </div>
            <p className="text-sm font-medium text-foreground truncate mt-0.5" title={source.name}>
              {source.name}
            </p>
          </div>
        </div>

        {/* AI & Audio metadata pills */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-center flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium text-[11px] flex items-center gap-1">
            <span>🧠</span> {modelBadge}
          </span>
          {transcriptData.language && (
            <span className="px-2 py-0.5 rounded bg-accent font-mono font-medium uppercase text-accent-foreground text-[11px]">
              {transcriptData.language}
            </span>
          )}
          {transcriptData.duration && (
            <span className="px-2 py-0.5 rounded bg-accent font-mono font-medium text-[11px]">
              {transcriptData.duration.toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Main Memory Card */}
      <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
        {/* Title & Topics Section */}
        <div className="p-6 flex flex-col gap-3">
          {analysisData.topics && analysisData.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Topics">
              {analysisData.topics.map((topic, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}

          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {analysisData.title || "Voice Memory"}
          </h2>
        </div>

        {/* Summary Section with TTS Voice Player */}
        <div className="p-6 flex flex-col gap-3 bg-secondary/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>📝</span> Summary
            </span>
            <div className="flex items-center gap-3">
              <VoiceSummaryPlayer text={analysisData.summary} label="Listen to summary" />
              <button
                type="button"
                onClick={handleCopySummary}
                aria-label="Copy summary text"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                {copiedSummary ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <p className="text-base text-foreground leading-relaxed">
            {analysisData.summary}
          </p>
        </div>

        {/* Tasks Section */}
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>✅</span> Actionable Tasks ({analysisData.tasks?.length || 0})
            </span>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {copiedMarkdown ? "✓ Copied as Markdown!" : "Export Markdown"}
            </button>
          </div>

          {analysisData.tasks && analysisData.tasks.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {analysisData.tasks.map((task, idx) => {
                const isDone = !!checkedTasks[idx];
                return (
                  <li
                    key={idx}
                    onClick={() => toggleTask(idx)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isDone
                        ? "bg-secondary/40 border-border/50 text-muted-foreground line-through"
                        : "bg-card border-border/80 text-foreground hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleTask(idx)}
                      className="mt-1 rounded text-primary focus:ring-primary h-4 w-4 shrink-0"
                      aria-label={`Mark task as completed: ${task}`}
                    />
                    <span className="text-sm leading-snug flex-1">{task}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No actionable tasks detected in this voice note.
            </p>
          )}
        </div>

        {/* Important Dates & People Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-secondary/10">
          {/* Important Dates */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>📅</span> Important Dates / Times
            </span>
            {datesList.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {datesList.map((date, idx) => (
                  <li
                    key={idx}
                    className="text-xs font-medium text-foreground px-2.5 py-1.5 rounded-md bg-accent/60 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{date}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No specific dates or times mentioned.
              </p>
            )}
          </div>

          {/* People Mentioned */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>👤</span> People Mentioned
            </span>
            {analysisData.people && analysisData.people.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {analysisData.people.map((person, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground"
                  >
                    {person}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No individual names mentioned.
              </p>
            )}
          </div>
        </div>

        {/* Full Transcript Accordion */}
        <div className="p-6 flex flex-col gap-3">
          <details className="group">
            <summary className="cursor-pointer font-medium text-xs uppercase tracking-wider text-muted-foreground group-open:text-foreground flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <span>🎙️</span> Full Speech Transcript
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyTranscript();
                  }}
                  className="text-primary hover:underline lowercase tracking-normal text-xs"
                >
                  {copiedTranscript ? "Copied!" : "Copy text"}
                </button>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </div>
            </summary>
            <div className="mt-3 p-4 rounded-xl bg-secondary/50 border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap selection:bg-primary/20">
              {transcriptData.transcript}
            </div>
          </details>
        </div>
      </div>

      {/* Save feedback error */}
      {saveError && (
        <div
          role="alert"
          className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive"
        >
          {saveError}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          id="reset-pipeline-btn"
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-sm
                     text-muted-foreground hover:bg-secondary hover:text-foreground
                     transition-colors font-medium text-center"
        >
          ← Process another voice note
        </button>

        {onSave && (
          <button
            type="button"
            id="save-memory-btn"
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={`w-full sm:flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-150 flex items-center justify-center gap-2 ${
              isSaved
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-98"
            }`}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Saving to MongoDB Atlas…
              </>
            ) : isSaved ? (
              <>
                <span>✓</span> Memory Saved to MongoDB Atlas
              </>
            ) : (
              <>
                <span>💾</span> Save to Memories
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
