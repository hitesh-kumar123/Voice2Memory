import Link from "next/link";
import { MicIcon, PlusIcon, SparklesIcon } from "@/components/ui/icons";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/80 transition-all"
      role="banner"
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link
          href="/"
          id="header-logo"
          className="flex items-center gap-2.5 group hover:opacity-95 transition-opacity"
          aria-label="Voice2Memory home"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-xs shadow-primary/20 group-hover:scale-105 transition-transform">
            <MicIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground tracking-tight text-sm leading-tight flex items-center gap-1.5">
              Voice2Memory
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-accent text-accent-foreground">
                Gemma 2
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <Link
            id="nav-memories"
            href="/memories"
            className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground rounded-lg
                       hover:bg-secondary hover:text-foreground transition-colors"
          >
            All Memories
          </Link>
          <Link
            id="nav-new-note"
            href="/record"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg
                       bg-primary text-primary-foreground shadow-xs shadow-primary/25
                       hover:bg-primary/90 active:scale-95
                       transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>New Note</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
