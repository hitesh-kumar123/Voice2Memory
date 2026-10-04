import type { Memory } from "@/types";
import { formatMemoryDate } from "@/lib/mockData";
import Link from "next/link";

interface MemoryCardProps {
  memory: Memory;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const { _id, title, summary, tasks, topics, people, dates, createdAt } = memory;

  return (
    <article
      className="group bg-card rounded-xl p-5 border border-border card-shadow
                 hover:card-shadow-hover hover:border-primary/20
                 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Top row: date + topics */}
      <div className="flex items-start justify-between gap-2">
        <time
          dateTime={new Date(createdAt).toISOString()}
          className="text-xs text-muted-foreground shrink-0"
        >
          {formatMemoryDate(createdAt)}
        </time>
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {topics.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
        {title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {summary}
      </p>

      {/* Footer row: task count + people */}
      <div className="pt-1 flex items-center gap-3 text-xs text-muted-foreground border-t border-border">
        {tasks.length > 0 && (
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        )}
        {people.length > 0 && (
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            {people.join(", ")}
          </span>
        )}
        {dates.length > 0 && (
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {dates.length} {dates.length === 1 ? "date" : "dates"}
          </span>
        )}
        {/* Spacer + read-more cue */}
        <Link
          href={`/memories/${_id ?? ""}`}
          id={`memory-card-${_id ?? "unknown"}`}
          className="ml-auto text-primary font-medium hover:underline underline-offset-2
                     focus-visible:underline transition-colors"
          aria-label={`View memory: ${title}`}
        >
          View →
        </Link>
      </div>
    </article>
  );
}
