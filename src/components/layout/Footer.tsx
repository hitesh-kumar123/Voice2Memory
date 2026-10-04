import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-secondary/30 mt-auto py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Brand & Privacy note */}
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-sm text-foreground">Voice2Memory</span>
            <span className="text-xs text-muted-foreground/60">·</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Open-Weight AI (Gemma 2)
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed mt-0.5">
            Voice2Memory pairs faster-whisper speech transcription with Google Gemma 2 open-weight LLM
            and MongoDB Atlas persistent indexing — giving your friend private, structured personal memory.
          </p>
        </div>

        {/* Right: Hacktoberfest badge and navigation */}
        <div className="flex flex-col sm:items-end gap-2 text-center sm:text-right text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/record" className="hover:text-foreground transition-colors">
              Record
            </Link>
            <Link href="/memories" className="hover:text-foreground transition-colors">
              Memories
            </Link>
          </div>
          <p className="text-[11px] text-muted-foreground/80">
            Built for Hacktoberfest 2026 DEV Challenge #1 — &quot;Build for a Friend&quot;
          </p>
        </div>
      </div>
    </footer>
  );
}
