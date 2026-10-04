"use client";

import { useEffect, useState } from "react";
import type { Memory, LoadingState } from "@/types";
import MemoryCard from "@/components/memory/MemoryCard";
import Link from "next/link";
import { MicIcon, ArrowRightIcon, RefreshIcon, AlertIcon } from "@/components/ui/icons";

interface RecentMemoriesProps {
  initialMemories?: Memory[];
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-border/80 rounded-2xl p-8 bg-secondary/10">
      <div
        className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-xs"
        aria-hidden="true"
      >
        <MicIcon className="w-6 h-6" />
      </div>
      <div className="max-w-sm">
        <h3 className="font-semibold text-foreground text-base mb-1">No memories captured yet</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Record a voice note or choose a quick sample to see Google Gemma 2 extract structured action items and summaries.
        </p>
      </div>
      <Link
        id="recent-empty-record-btn"
        href="/record"
        className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-primary text-primary-foreground text-xs font-semibold
                   hover:bg-primary/90 active:scale-95 transition-all shadow-xs"
      >
        <MicIcon className="w-3.5 h-3.5" />
        <span>Create First Voice Note</span>
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 text-center gap-3 border border-border/80 rounded-2xl p-8 bg-secondary/10"
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertIcon className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">
        Could not load memories from database
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Ensure your MongoDB connection is active.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4"
        >
          <RefreshIcon className="w-3 h-3" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/80 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="skeleton h-3.5 w-24 rounded" />
        <div className="skeleton h-4 w-16 rounded-full" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-5/6 rounded" />
      </div>
      <div className="pt-3 border-t border-border/60 flex gap-4">
        <div className="skeleton h-3.5 w-14 rounded" />
        <div className="skeleton h-3.5 w-16 rounded" />
      </div>
    </div>
  );
}

export default function RecentMemories({ initialMemories }: RecentMemoriesProps) {
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
      className="max-w-5xl mx-auto px-6 pb-24"
      aria-labelledby="recent-memories-heading"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 border-t border-border/80 pt-12">
        <div>
          <h2
            id="recent-memories-heading"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Recent Memories
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Extracted and synchronized with MongoDB Atlas
          </p>
        </div>

        {memories.length > 0 && loadingState === "success" && (
          <Link
            id="view-all-memories-link"
            href="/memories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <span>View all</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Loading Skeleton */}
      {loadingState === "loading" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {/* Error state */}
      {loadingState === "error" && <ErrorState onRetry={fetchRecent} />}

      {/* Empty State */}
      {loadingState === "success" && memories.length === 0 && <EmptyState />}

      {/* Memory Grid */}
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
