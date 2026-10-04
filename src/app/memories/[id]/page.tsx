"use client";

import { useEffect, useState, use } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Memory } from "@/types";
import { formatMemoryDate } from "@/lib/mockData";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import VoiceSummaryPlayer from "@/components/ui/VoiceSummaryPlayer";
import {
  BrainIcon,
  FileTextIcon,
  CheckSquareIcon,
  CalendarIcon,
  UsersIcon,
  MicIcon,
  CopyIcon,
  CheckIcon,
  ExportIcon,
  TrashIcon,
  AlertIcon,
  ClockIcon,
  TagIcon,
  DatabaseIcon,
} from "@/components/ui/icons";

interface MemoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MemoryDetailPage({ params }: MemoryDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadMemory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/memories/${id}`);
        const data = await res.json();
        if (res.ok && data.success && data.memory) {
          setMemory(data.memory);
          // Initialize completed tasks from memory
          const completed = data.memory.completedTasks || [];
          const initialChecked: Record<string, boolean> = {};
          completed.forEach((t: string) => {
            initialChecked[t] = true;
          });
          setCheckedTasks(initialChecked);
        } else {
          setError(data.error || "Memory not found.");
        }
      } catch {
        setError("Failed to fetch memory from database.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMemory();
    }
  }, [id]);

  const handleCopySummary = async () => {
    if (!memory?.summary) return;
    try {
      await navigator.clipboard.writeText(memory.summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyTranscript = async () => {
    if (!memory?.transcript) return;
    try {
      await navigator.clipboard.writeText(memory.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExportMarkdown = async () => {
    if (!memory) return;
    const datesList = memory.importantDates || memory.dates || [];
    const md = `# ${memory.title}

**Engine:** Google Gemma 2 (Open-Weight AI) & OpenAI Whisper
**Persistent Store:** MongoDB Atlas
**Recorded Date:** ${new Date(memory.createdAt).toLocaleDateString()}

## Summary
${memory.summary}

## Actionable Tasks
${
  memory.tasks && memory.tasks.length > 0
    ? memory.tasks
        .map((t) => `- [${checkedTasks[t] ? "x" : " "}] ${t}`)
        .join("\n")
    : "_No actionable tasks recorded._"
}

## Important Dates & Times
${
  datesList.length > 0
    ? datesList.map((d) => `- ${d}`).join("\n")
    : "_None mentioned._"
}

## People Mentioned
${
  memory.people && memory.people.length > 0
    ? memory.people.map((p) => `- ${p}`).join("\n")
    : "_None mentioned._"
}

## Full Transcript
> ${memory.transcript}
`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      // Fallback
    }
  };

  const toggleTask = async (taskText: string) => {
    const nextState = !checkedTasks[taskText];
    const updated = { ...checkedTasks, [taskText]: nextState };
    setCheckedTasks(updated);

    // Persist completed tasks to MongoDB Atlas
    const completedList = Object.keys(updated).filter((k) => updated[k]);
    try {
      await fetch(`/api/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedTasks: completedList }),
      });
    } catch (err) {
      console.error("Failed to persist task state:", err);
    }
  };

  const handleDelete = async () => {
    if (!memory?._id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/memories/${memory._id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/memories");
      } else {
        setIsDeleting(false);
      }
    } catch {
      setIsDeleting(false);
    }
  };

  const datesList = memory?.importantDates || memory?.dates || [];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main
        id="memory-detail-main"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12"
      >
        {/* Top Back Link & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/memories"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <span>← Back to all memories</span>
          </Link>

          {memory && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 transition-colors"
              >
                {copiedMarkdown ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied Markdown</span>
                  </>
                ) : (
                  <>
                    <ExportIcon className="w-3.5 h-3.5" />
                    <span>Export Markdown</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete this memory"
                className="text-xs font-semibold text-destructive/80 hover:text-destructive inline-flex items-center gap-1 transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" label="Loading memory details…" />
            <p className="text-xs text-muted-foreground">Fetching from MongoDB Atlas…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            role="alert"
            className="p-8 rounded-2xl border border-border/80 bg-card text-center flex flex-col items-center gap-3"
          >
            <h2 className="text-lg font-bold text-foreground">Memory not found</h2>
            <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
            <Link
              href="/memories"
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
            >
              View all memories
            </Link>
          </div>
        )}

        {/* Main Memory Content */}
        {!loading && memory && (
          <article className="flex flex-col gap-6 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col gap-3.5 pb-6 border-b border-border/70">
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5 opacity-60" />
                  <time dateTime={new Date(memory.createdAt).toISOString()}>
                    {formatMemoryDate(memory.createdAt)}
                  </time>
                </span>
                {memory.audioFileName && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{memory.audioFileName}</span>
                  </>
                )}
                {memory.audioDuration && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded-md bg-secondary font-mono text-[11px] border border-border/50">
                      {memory.audioDuration.toFixed(1)}s audio
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium text-[11px] flex items-center gap-1 border border-primary/20">
                  <BrainIcon className="w-3 h-3" />
                  <span>Google Gemma 2</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1 border border-emerald-500/20">
                  <DatabaseIcon className="w-3 h-3" />
                  <span>MongoDB Atlas</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                {memory.title}
              </h1>

              {memory.topics && memory.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {memory.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/15 flex items-center gap-1"
                    >
                      <TagIcon className="w-3 h-3 opacity-70" />
                      <span>{topic}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Box with TTS Narration */}
            <div className="p-6 rounded-2xl bg-secondary/15 border border-border/80 flex flex-col gap-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileTextIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Executive Summary</span>
                </span>
                <div className="flex items-center gap-3">
                  <VoiceSummaryPlayer text={memory.summary} label="Listen to summary" />
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    {copiedSummary ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-base text-foreground/90 leading-relaxed">
                {memory.summary}
              </p>
            </div>

            {/* Tasks Section with Interactive Persistence */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 flex flex-col gap-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckSquareIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Actionable Tasks ({memory.tasks?.length || 0})</span>
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <DatabaseIcon className="w-3 h-3 opacity-60" />
                  <span>Live Sync to Atlas</span>
                </span>
              </div>

              {memory.tasks && memory.tasks.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {memory.tasks.map((task, idx) => {
                    const isDone = !!checkedTasks[task];
                    return (
                      <li
                        key={idx}
                        onClick={() => toggleTask(task)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isDone
                            ? "bg-secondary/40 border-border/40 text-muted-foreground line-through"
                            : "bg-card border-border/80 text-foreground hover:border-primary/40 hover:bg-secondary/20"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleTask(task)}
                          className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 shrink-0 accent-primary cursor-pointer"
                          aria-label={`Task: ${task}`}
                        />
                        <span className="text-sm leading-snug">{task}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No actionable tasks recorded in this voice note.
                </p>
              )}
            </div>

            {/* Dates & People Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Important Dates */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 flex flex-col gap-2.5 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Important Dates & Times</span>
                </span>
                {datesList.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 mt-1">
                    {datesList.map((date, idx) => (
                      <li
                        key={idx}
                        className="text-xs font-medium text-foreground px-3 py-2 rounded-lg bg-secondary/30 border border-border/60 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{date}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    No dates or deadlines mentioned.
                  </p>
                )}
              </div>

              {/* People Mentioned */}
              <div className="p-5 rounded-2xl bg-card border border-border/80 flex flex-col gap-2.5 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UsersIcon className="w-3.5 h-3.5 text-primary" />
                  <span>People Mentioned</span>
                </span>
                {memory.people && memory.people.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {memory.people.map((person, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/60 text-foreground"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic mt-1">
                    No names mentioned.
                  </p>
                )}
              </div>
            </div>

            {/* Full Transcript */}
            <div className="p-6 rounded-2xl bg-card border border-border/80 flex flex-col gap-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MicIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Original Transcript</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  {copiedTranscript ? (
                    <>
                      <CheckIcon className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3 h-3" />
                      <span>Copy transcript</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap selection:bg-primary/20 bg-secondary/30 p-4 rounded-xl border border-border/60">
                {memory.transcript}
              </p>
            </div>
          </article>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          >
            <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
                  <AlertIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="delete-dialog-title"
                    className="font-bold text-foreground text-base"
                  >
                    Delete this memory?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    This action is permanent and will remove the record from your MongoDB Atlas database.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
