"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import MemoryCard from "@/components/memory/MemoryCard";
import type { Memory, LoadingState } from "@/types";
import Link from "next/link";
import { MicIcon } from "@/components/ui/icons";

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoadingState("loading");
      try {
        const res = await fetch("/api/memories");
        const data = await res.json();
        if (isCancelled) return;

        if (res.ok && data.success) {
          setMemories(data.memories || []);
          setLoadingState("success");
        } else {
          setLoadingState("error");
        }
      } catch {
        if (!isCancelled) setLoadingState("error");
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const fetchMemories = () => setReloadKey((k) => k + 1);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMemories((prev) => prev.filter((m) => m._id !== id));
        setDeleteConfirmId(null);
      }
    } catch {
      // Error handling
    } finally {
      setDeletingId(null);
    }
  };

  // Collect unique topics across all memories
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => {
      (m.topics || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [memories]);

  // Client-side search & topic filtering for instant feedback
  const filteredMemories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return memories.filter((m) => {
      // Topic match
      if (selectedTopic && !m.topics?.includes(selectedTopic)) {
        return false;
      }

      // Query match across fields
      if (!q) return true;

      const titleMatch = m.title?.toLowerCase().includes(q);
      const summaryMatch = m.summary?.toLowerCase().includes(q);
      const transcriptMatch = m.transcript?.toLowerCase().includes(q);
      const topicsMatch = m.topics?.some((t) => t.toLowerCase().includes(q));
      const peopleMatch = m.people?.some((p) => p.toLowerCase().includes(q));
      const tasksMatch = m.tasks?.some((tk) => tk.toLowerCase().includes(q));
      const datesMatch = (m.importantDates || m.dates || []).some((d) =>
        d.toLowerCase().includes(q)
      );

      return (
        titleMatch ||
        summaryMatch ||
        transcriptMatch ||
        topicsMatch ||
        peopleMatch ||
        tasksMatch ||
        datesMatch
      );
    });
  }, [memories, searchQuery, selectedTopic]);

  return (
    <>
      <Header />
      <main
        id="memories-main"
        className="flex-1 max-w-5xl mx-auto w-full px-6 py-12"
      >
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              All Memories
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search and organize your extracted voice notes.
            </p>
          </div>

          <Link
            id="memories-record-new-btn"
            href="/record"
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-primary text-primary-foreground text-sm font-semibold
                       hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <MicIcon className="w-4 h-4" />
            <span>New voice note</span>
          </Link>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative">
            <input
              id="memory-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across title, summary, tasks, people, or topics…"
              aria-label="Search memories"
              className="w-full px-4 py-3 pl-11 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-xs"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Topic Pills */}
          {allTopics.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedTopic === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                All topics ({memories.length})
              </button>
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() =>
                    setSelectedTopic((prev) => (prev === topic ? null : topic))
                  }
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    selectedTopic === topic
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  #{topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loadingState === "loading" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-card rounded-xl p-5 border border-border flex flex-col gap-3"
              >
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-4 w-12 rounded-full" />
                </div>
                <div className="skeleton h-5 w-3/4 rounded" />
                <div className="skeleton h-3.5 w-full rounded" />
                <div className="skeleton h-3.5 w-4/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {loadingState === "error" && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-20 text-center gap-3"
          >
            <p className="text-base font-semibold text-destructive">
              Failed to load memories
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Ensure your MongoDB connection is active.
            </p>
            <button
              type="button"
              onClick={fetchMemories}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State (No memories saved yet) */}
        {loadingState === "success" && memories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center"
              aria-hidden="true"
            >
              <MicIcon className="w-8 h-8 text-accent-foreground" />
            </div>
            <h2 className="font-semibold text-foreground text-xl">
              No memories saved yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Record your first voice note or upload an audio clip to extract structured memories.
            </p>
            <Link
              id="memories-empty-record-btn"
              href="/record"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-primary text-primary-foreground text-sm font-semibold
                         hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <MicIcon className="w-4 h-4" />
              Record your first note
            </Link>
          </div>
        )}

        {/* No Search Matches */}
        {loadingState === "success" &&
          memories.length > 0 &&
          filteredMemories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-base font-semibold text-foreground">
                No memories match &quot;{searchQuery || selectedTopic}&quot;
              </p>
              <p className="text-xs text-muted-foreground">
                Try searching for a different keyword or topic tag.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTopic(null);
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Memory Grid */}
        {loadingState === "success" && filteredMemories.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            role="list"
            aria-label="Memories list"
          >
            {filteredMemories.map((memory) => (
              <div key={memory._id} className="relative group">
                <MemoryCard memory={memory} />

                {/* Quick Delete action button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {deleteConfirmId === memory._id ? (
                    <div className="flex items-center gap-1.5 bg-background/95 border border-destructive/40 p-1 rounded-lg shadow-sm">
                      <span className="text-[11px] text-destructive font-medium pl-1">
                        Delete?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(memory._id!)}
                        disabled={deletingId === memory._id}
                        className="px-2 py-0.5 rounded bg-destructive text-white text-[11px] font-semibold hover:opacity-90"
                      >
                        {deletingId === memory._id ? "…" : "Yes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-0.5 rounded text-muted-foreground text-[11px] hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(memory._id!);
                      }}
                      aria-label={`Delete memory: ${memory.title}`}
                      title="Delete memory"
                      className="p-1.5 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shadow-xs"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
