"use client";

import { useState, useRef, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { VolumeIcon, VolumeMuteIcon, PlayIcon } from "@/components/ui/icons";

interface VoiceSummaryPlayerProps {
  text: string;
  label?: string;
  className?: string;
}

export default function VoiceSummaryPlayer({
  text,
  label = "Listen to summary",
  className = "",
}: VoiceSummaryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayTTS = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (data.success && data.audioUrl && data.provider === "elevenlabs") {
        setProviderUsed("ElevenLabs");
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);

        await audio.play();
        setIsPlaying(true);
      } else {
        // Fallback to browser SpeechSynthesis
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          setProviderUsed("Web Speech");
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);

          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
        } else {
          alert("Speech synthesis is not supported in this browser.");
        }
      }
    } catch (err) {
      console.error("TTS playback error:", err);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setProviderUsed("Web Speech");
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handlePlayTTS}
        disabled={isLoading || !text}
        aria-label={isPlaying ? "Stop voice narration" : "Play voice narration"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
          isPlaying
            ? "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15"
            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 active:scale-95"
        }`}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" label="Generating audio…" />
            <span>Synthesizing…</span>
          </>
        ) : isPlaying ? (
          <>
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <VolumeMuteIcon className="w-3.5 h-3.5" />
            <span>Stop Audio</span>
          </>
        ) : (
          <>
            <VolumeIcon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </>
        )}
      </button>

      {providerUsed && isPlaying && (
        <span className="text-[10px] text-muted-foreground font-mono">
          ({providerUsed})
        </span>
      )}
    </div>
  );
}
