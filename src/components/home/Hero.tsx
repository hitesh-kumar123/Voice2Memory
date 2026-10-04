import Link from "next/link";
import { MicIcon, UploadIcon } from "@/components/ui/icons";

export default function Hero() {
  return (
    <section
      className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center"
      aria-labelledby="hero-heading"
    >
      {/* Eyebrow badge */}
      <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6 border border-border">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Built for a Friend · Powered by Google Gemma 2 & MongoDB Atlas</span>
      </div>

      {/* Headline */}
      <h1
        id="hero-heading"
        className="animate-fade-up delay-75 text-[2.75rem] md:text-6xl font-semibold
                   text-foreground leading-[1.1] tracking-tight mb-6 max-w-3xl mx-auto"
        style={{ opacity: 0 }}
      >
        Turn voice notes into memories{" "}
        <span className="text-primary">you can actually use.</span>
      </h1>

      {/* Sub-heading */}
      <p
        className="animate-fade-up delay-150 text-lg text-muted-foreground max-w-xl mx-auto
                   mb-10 leading-relaxed"
        style={{ opacity: 0 }}
      >
        Speak freely. Whisper transcribes. <strong className="text-foreground font-semibold">Google Gemma 2</strong> structures tasks, dates, and people into a searchable memory system.
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-primary text-primary-foreground font-semibold text-sm
                     hover:opacity-90 active:scale-95 shadow-sm
                     transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MicIcon className="w-4 h-4" />
          Record voice note
        </Link>

        <Link
          id="hero-upload-btn"
          href="/record#upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-secondary text-secondary-foreground font-semibold text-sm border border-border
                     hover:bg-muted active:scale-95
                     transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UploadIcon className="w-4 h-4" />
          Upload audio file
        </Link>
      </div>

      {/* Feature summary row */}
      <div
        className="animate-fade-up delay-300 mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"
        style={{ opacity: 0 }}
      >
        <span className="flex items-center gap-1.5">
          <span>🔒</span> 100% Private & Open-Weight
        </span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <span>🧠</span> Google Gemma 2 (2B)
        </span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <span>🍃</span> MongoDB Atlas Persistent Store
        </span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <span>🎙️</span> Faster-Whisper int8
        </span>
      </div>
    </section>
  );
}
