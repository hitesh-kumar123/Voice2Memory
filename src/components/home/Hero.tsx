import Link from "next/link";
import {
  MicIcon,
  UploadIcon,
  SparklesIcon,
  ShieldIcon,
  BrainIcon,
  DatabaseIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";

export default function Hero() {
  return (
    <section
      className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center relative"
      aria-labelledby="hero-heading"
    >
      {/* Top Eyebrow Badge */}
      <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/80 text-accent-foreground text-xs font-medium mb-8 border border-border/80 shadow-xs">
        <SparklesIcon className="w-3.5 h-3.5 text-primary" />
        <span>Built for a Friend · Powered by Google Gemma 2 & MongoDB Atlas</span>
      </div>

      {/* Main Headline */}
      <h1
        id="hero-heading"
        className="animate-fade-up delay-75 text-4xl sm:text-5xl md:text-6xl font-semibold
                   text-foreground leading-[1.08] tracking-tight mb-6 max-w-3xl mx-auto"
        style={{ opacity: 0 }}
      >
        Turn spoken voice notes into{" "}
        <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
          structured personal memory.
        </span>
      </h1>

      {/* Sub-heading */}
      <p
        className="animate-fade-up delay-150 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto
                   mb-10 leading-relaxed font-normal"
        style={{ opacity: 0 }}
      >
        Speak freely while commuting or between meetings. Faster-Whisper transcribes, and <strong className="text-foreground font-semibold">Google Gemma 2</strong> instantly extracts actionable tasks, dates, people, and topics.
      </p>

      {/* CTA Buttons */}
      <div
        className="animate-fade-up delay-225 flex flex-col sm:flex-row items-center
                   justify-center gap-3.5"
        style={{ opacity: 0 }}
      >
        <Link
          id="hero-record-btn"
          href="/record"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20
                     hover:bg-primary/90 active:scale-98
                     transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MicIcon className="w-4 h-4" />
          <span>Record Voice Note</span>
        </Link>

        <Link
          id="hero-upload-btn"
          href="/record#upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-secondary text-secondary-foreground font-semibold text-sm border border-border/80
                     hover:bg-secondary/80 active:scale-98
                     transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UploadIcon className="w-4 h-4 text-muted-foreground" />
          <span>Upload Audio File</span>
        </Link>
      </div>

      {/* Modern Feature Specs Strip */}
      <div
        className="animate-fade-up delay-300 mt-14 pt-8 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldIcon className="w-3.5 h-3.5 text-primary" />
          <span>100% Private Open-Weight AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BrainIcon className="w-3.5 h-3.5 text-primary" />
          <span>Google Gemma 2 (2B)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DatabaseIcon className="w-3.5 h-3.5 text-primary" />
          <span>MongoDB Atlas Search</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MicIcon className="w-3.5 h-3.5 text-primary" />
          <span>Faster-Whisper int8</span>
        </div>
      </div>
    </section>
  );
}
