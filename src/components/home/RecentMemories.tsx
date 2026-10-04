"use client";

import { useEffect, useState } from "react";
import type { Memory, LoadingState } from "@/types";
import MemoryCard from "@/components/memory/MemoryCard";
import Link from "next/link";
import { MicIcon } from "@/components/ui/icons";

interface RecentMemoriesProps {
  initialMemories?: Memory[];
}

// ── Empty state ──────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div
        className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center"
        aria-hidden="true"
      >
        <MicIcon className="w-8 h-8 text-accent-foreground" />
      </div>
      <div className="max-w-xs">
        <h3 className="font-semibold text-foreground mb-1">No memories yet</h3>
        <p className="text-sm text-muted-foreground">
          Record your first voice note and it will appear here as a structured memory.
        </p>
      </div>
      <Link
        id="recent-empty-record-btn"
        href="/record"
        className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                   bg-primary text-primary-foreground text-sm font-medium
                   hover:opacity-90 active:scale-95 transition-all duration-150"
      >
        <MicIcon className="w-4 h-4" />
        Record voice note
      </Link>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 text-center gap-3"
    >
      <p className="text-sm font-semibold text-destructive">
        Couldn&apos;t load recent memories
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Make sure your local MongoDB server is running.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-primary hover:underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ── Skeleton loading state ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-4 w-14 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="space-y-1.5">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-5/6 rounded" />
      </div>
      <div className="pt-2 border-t border-border flex gap-4">
        <div className="skeleton h-3 w-12 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  );
}

export default function RecentMemories({
  initialMemories,
}: RecentMemoriesProps) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories || []);
  const [loadingState, setLoadingState] = useState<LoadingState>(
    initialMemories ? "success" : "loading"
  );

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (initialMemories) return;

    let isCancelled = false;

    async function load() {
      setLoadingState("loading");
      try {
        const res = await fetch("/api/memories");
        const data = await res.json();
        if (isCancelled) return;

        if (res.ok && data.success) {
          setMemories((data.memories || []).slice(0, 4));
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
  }, [initialMemories, reloadKey]);

  const fetchRecent = () => setReloadKey((k) => k + 1);

  return (
    <section
      className="max-w-5xl mx-auto px-6 pb-20"
      aria-labelledby="recent-memories-heading"
    >
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-6 border-t border-border pt-10">
        <h2
          id="recent-memories-heading"
          className="text-xl font-semibold text-foreground"
        >
          Recent memories
        </h2>
        {memories.length > 0 && loadingState === "success" && (
          <Link
            id="view-all-memories-link"
            href="/memories"
            className="text-sm text-primary hover:underline underline-offset-2 transition-colors font-medium"
          >
            View all ({memories.length}) →
          </Link>
        )}
      </div>

      {/* States */}
      {loadingState === "loading" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {loadingState === "error" && <ErrorState onRetry={fetchRecent} />}

      {loadingState === "success" && memories.length === 0 && <EmptyState />}

      {loadingState === "success" && memories.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          role="list"
          aria-label="Recent memories"
        >
          {memories.map((memory, i) => (
            <div
              key={memory._id}
              role="listitem"
              className="animate-fade-up"
              style={{ opacity: 0, animationDelay: `${i * 60}ms` }}
            >
              <MemoryCard memory={memory} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
