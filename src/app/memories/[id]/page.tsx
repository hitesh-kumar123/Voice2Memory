"use client";

import { useEffect, useState, use } from "react";
import Header from "@/components/layout/Header";
import type { Memory } from "@/types";
import { formatMemoryDate } from "@/lib/mockData";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
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

  const toggleTask = (index: number) => {
    setCheckedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
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
    <>
      <Header />
      <main
        id="memory-detail-main"
        className="flex-1 max-w-3xl mx-auto w-full px-6 py-12"
      >
        {/* Top Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/memories"
            className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to all memories
          </Link>

          {memory && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete this memory"
              className="text-xs font-medium text-destructive hover:underline inline-flex items-center gap-1"
            >
              Delete memory
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" label="Loading memory details…" />
            <p className="text-xs text-muted-foreground">Fetching from database…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div role="alert" className="p-8 rounded-2xl border border-border bg-card text-center flex flex-col items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Memory not found</h2>
            <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
            <Link
              href="/memories"
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
            >
              View all memories
            </Link>
          </div>
        )}

        {/* Main Memory Content */}
        {!loading && memory && (
          <article className="flex flex-col gap-6 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col gap-3 pb-6 border-b border-border">
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <time dateTime={new Date(memory.createdAt).toISOString()}>
                  {formatMemoryDate(memory.createdAt)}
                </time>
                {memory.audioFileName && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{memory.audioFileName}</span>
                  </>
                )}
                {memory.audioDuration && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded bg-accent font-mono text-[11px]">
                      {memory.audioDuration.toFixed(1)}s audio
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                {memory.title}
              </h1>

              {memory.topics && memory.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {memory.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Box */}
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span>📝</span> Summary
                </span>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {copiedSummary ? "Copied!" : "Copy summary"}
                </button>
              </div>
              <p className="text-base text-foreground leading-relaxed">
                {memory.summary}
              </p>
            </div>

            {/* Tasks Section */}
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>✅</span> Actionable Tasks ({memory.tasks?.length || 0})
              </span>

              {memory.tasks && memory.tasks.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {memory.tasks.map((task, idx) => {
                    const isDone = !!checkedTasks[idx];
                    return (
                      <li
                        key={idx}
                        onClick={() => toggleTask(idx)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isDone
                            ? "bg-secondary/40 border-border/50 text-muted-foreground line-through"
                            : "bg-card border-border text-foreground hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleTask(idx)}
                          className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4 shrink-0"
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
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span>📅</span> Important Dates & Times
                </span>
                {datesList.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 mt-1">
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
                  <p className="text-xs text-muted-foreground italic mt-1">
                    No dates or deadlines mentioned.
                  </p>
                )}
              </div>

              {/* People Mentioned */}
              <div className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span>👤</span> People Mentioned
                </span>
                {memory.people && memory.people.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {memory.people.map((person, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary border border-border text-foreground"
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
            <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span>🎙️</span> Original Transcript
                </span>
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {copiedTranscript ? "Copied!" : "Copy transcript"}
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap selection:bg-primary/20 bg-secondary/30 p-4 rounded-xl border border-border">
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 id="delete-dialog-title" className="font-semibold text-foreground text-base">
                    Delete this memory?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-xl bg-destructive text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
