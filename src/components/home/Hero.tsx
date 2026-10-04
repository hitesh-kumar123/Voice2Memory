import Link from "next/link";
import { MicIcon, UploadIcon } from "@/components/ui/icons";

export default function Hero() {
  return (
    <section
      className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center"
      aria-labelledby="hero-heading"
    >
      {/* Eyebrow */}
      <p className="animate-fade-up text-sm font-medium text-primary mb-5 tracking-wide uppercase">
        Open-source · Private · Local AI
      </p>

      {/* Headline */}
      <h1
        id="hero-heading"
        className="animate-fade-up delay-75 text-[2.75rem] md:text-6xl font-semibold
                   text-foreground leading-[1.1] tracking-tight mb-6 max-w-3xl mx-auto"
        style={{ opacity: 0 }}
      >
        Turn your voice into memories{" "}
        <span className="text-primary">you can actually use.</span>
      </h1>

      {/* Sub-heading */}
      <p
        className="animate-fade-up delay-150 text-lg text-muted-foreground max-w-xl mx-auto
                   mb-10 leading-relaxed"
        style={{ opacity: 0 }}
      >
        Speak. Whisper transcribes. Ollama understands.
        <br />
        Every voice note becomes tasks, dates, people, and ideas — saved and searchable.
      </p>

      {/* CTAs */}
      <div
        className="animate-fade-up delay-225 flex flex-col sm:flex-row items-center
                   justify-center gap-3"
        style={{ opacity: 0 }}
      >
        <Link
          id="hero-record-btn"
          href="/record"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                     bg-primary text-primary-foreground font-medium text-sm
                     hover:opacity-90 active:scale-95
                     transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MicIcon className="w-4 h-4" />
          Record voice note
        </Link>

        <Link
          id="hero-upload-btn"
          href="/record#upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                     bg-secondary text-secondary-foreground font-medium text-sm border border-border
                     hover:bg-muted active:scale-95
                     transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UploadIcon className="w-4 h-4" />
          Upload audio file
        </Link>
      </div>

      {/* Subtle feature hint */}
      <p
        className="animate-fade-up delay-300 mt-8 text-xs text-muted-foreground/70"
        style={{ opacity: 0 }}
      >
        Supports MP3 · WAV · M4A · WebM &nbsp;·&nbsp; Runs on your machine &nbsp;·&nbsp; No data leaves your device
      </p>
    </section>
  );
}
