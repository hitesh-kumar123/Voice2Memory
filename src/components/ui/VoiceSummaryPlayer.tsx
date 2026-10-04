"use client";

import { useState, useRef, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

  // Clean up on unmount
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
        setProviderUsed("ElevenLabs AI Voice");
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
        };
        audio.onerror = () => {
          setIsPlaying(false);
        };

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

          utterance.onend = () => {
            setIsPlaying(false);
          };
          utterance.onerror = () => {
            setIsPlaying(false);
          };

          window.speechSynthesis.speak(utterance);
          setIsPlaying(true);
        } else {
          alert("Speech synthesis is not supported in this browser.");
        }
      }
    } catch (err) {
      console.error("TTS playback error:", err);
      // Fallback to browser Web Speech API
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all shadow-xs"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" label="Generating voice..." />
            <span>Generating voice…</span>
          </>
        ) : isPlaying ? (
          <>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Stop audio</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
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
