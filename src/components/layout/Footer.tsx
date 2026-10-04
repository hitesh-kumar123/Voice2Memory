import Link from "next/link";
import { BrainIcon, ShieldIcon, DatabaseIcon } from "@/components/ui/icons";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-secondary/30 mt-auto py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Brand & Open AI Spec */}
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-sm text-foreground">Voice2Memory</span>
            <span className="text-xs text-muted-foreground/60">·</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldIcon className="w-3.5 h-3.5" />
              100% Private Open-Weight AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            Built with Faster-Whisper for transcription, Google Gemma 2 for memory reasoning, and MongoDB Atlas for indexed persistent search.
          </p>
        </div>

        {/* Right: Hacktoberfest challenge notice & Links */}
        <div className="flex flex-col sm:items-end gap-2 text-center sm:text-right text-xs text-muted-foreground">
          <div className="flex items-center gap-4 font-medium">
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
            Hacktoberfest 2026 Challenge: &quot;Build for a Friend&quot;
          </p>
        </div>
      </div>
    </footer>
  );
}
