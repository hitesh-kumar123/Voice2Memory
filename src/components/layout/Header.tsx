import Link from "next/link";
import { MicIcon } from "@/components/ui/icons";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      role="banner"
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          id="header-logo"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Voice2Memory home"
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary"
            aria-hidden="true"
          >
            <MicIcon className="w-4 h-4 text-white" />
          </span>
          <span className="font-semibold text-foreground tracking-tight">
            Voice2Memory
          </span>
        </Link>

        {/* Nav */}
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link
            id="nav-memories"
            href="/memories"
            className="px-3 py-1.5 text-sm text-muted-foreground rounded-md
                       hover:bg-secondary hover:text-foreground transition-colors"
          >
            Memories
          </Link>
          <Link
            id="nav-new-note"
            href="/record"
            className="ml-2 px-4 py-2 text-sm font-medium rounded-lg
                       bg-primary text-primary-foreground
                       hover:opacity-90 active:scale-95
                       transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
          >
            + New note
          </Link>
        </nav>
      </div>
    </header>
  );
}
