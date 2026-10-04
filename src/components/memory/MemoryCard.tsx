import type { Memory } from "@/types";
import { formatMemoryDate } from "@/lib/mockData";
import Link from "next/link";
import {
  CheckSquareIcon,
  UsersIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

interface MemoryCardProps {
  memory: Memory;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const { _id, title, summary, tasks, topics, people, dates, createdAt } = memory;

  return (
    <article
      className="group bg-card rounded-2xl p-6 border border-border/80 card-shadow
                 hover:card-shadow-hover hover:border-primary/30
                 transition-all duration-200 flex flex-col gap-3.5 relative overflow-hidden"
    >
      {/* Top row: formatted date + topic tags */}
      <div className="flex items-start justify-between gap-2">
        <time
          dateTime={new Date(createdAt).toISOString()}
          className="text-xs font-medium text-muted-foreground/80 shrink-0 font-mono"
        >
          {formatMemoryDate(createdAt)}
        </time>
        {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {topics.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium border border-border/60"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Memory Title */}
      <h3 className="font-semibold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
        {title}
      </h3>

      {/* Executive Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {summary}
      </p>

      {/* Footer row: extracted tasks, people, dates badges */}
      <div className="pt-3 flex items-center gap-3.5 text-xs text-muted-foreground border-t border-border/60 mt-auto">
        {tasks && tasks.length > 0 && (
          <span className="flex items-center gap-1 font-medium">
            <CheckSquareIcon className="w-3.5 h-3.5 text-primary" />
            <span>{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
          </span>
        )}

        {people && people.length > 0 && (
          <span className="flex items-center gap-1 font-medium">
            <UsersIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate max-w-[120px]">{people.join(", ")}</span>
          </span>
        )}

        {dates && dates.length > 0 && (
          <span className="flex items-center gap-1 font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{dates.length}</span>
          </span>
        )}

        {/* View Memory Link */}
        <Link
          href={`/memories/${_id ?? ""}`}
          id={`memory-card-${_id ?? "unknown"}`}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 group-hover:translate-x-0.5 transition-all"
          aria-label={`View memory: ${title}`}
        >
          <span>Open</span>
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>
    </article>
  );
}
