"use client";

import { useState } from "react";
import type { AudioSource } from "@/types";
import TranscriptView from "@/components/recording/TranscriptView";

const SAMPLE_TRANSCRIPTS = [
  {
    title: "Startup Pitch & Podcast Microphone",
    sampleName: "alex-commute-pitch-deck.webm",
    text: "Hey Sarah, I'm heading over to the office now. Please remember to finalize the Q4 investor pitch deck with Alex by Thursday at 4 PM. We also need to schedule the follow-up meeting with Priya for next Monday afternoon. On my way back I have to order a new microphone for our podcast setup and email the contract to Tom.",
  },
  {
    title: "Doctor Appointment & Weekend Groceries",
    sampleName: "weekend-errands-mom.m4a",
    text: "Quick note for Saturday: remember to pick up organic eggs, coffee beans, and milk from the farmer's market. Drop off the coat at the dry cleaners before 2 PM. Call Mom about her birthday dinner on November 5th, and confirm Dr. Gupta's appointment on Friday morning at 10 AM.",
  },
  {
    title: "Design System Sprint Planning",
    sampleName: "marcus-design-sync.wav",
    text: "Marcus and I agreed to overhaul the UI component tokens before next Wednesday. Marcus is taking the lead on the dark mode color palette, and I need to review the Figma tokens with Emily by Friday. Let's make sure we test mobile accessibility before the release.",
  },
];

export default function SampleNoteTester() {
  const [selectedAudioSource, setSelectedAudioSource] = useState<AudioSource | null>(null);

  const handleTestSample = (sample: (typeof SAMPLE_TRANSCRIPTS)[0]) => {
    // Create an audio blob with silent audio or transcript container
    const dummyBlob = new Blob([sample.text], { type: "audio/webm" });
    const objectUrl = URL.createObjectURL(dummyBlob);

    const source: AudioSource = {
      type: "upload",
      blob: dummyBlob,
      name: sample.sampleName,
      size: 1024 * 45,
      objectUrl,
    };

    setSelectedAudioSource(source);
  };

  if (selectedAudioSource) {
    return (
      <div className="w-full flex justify-center">
        <TranscriptView
          source={selectedAudioSource}
          onReset={() => setSelectedAudioSource(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>⚡</span> Quick Demo / Sample Voice Notes
        </span>
        <span className="text-[11px] text-primary font-medium">1-Click Test</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Test the complete Google Gemma 2 structuring and MongoDB Atlas workflow instantly:
      </p>

      <div className="flex flex-col gap-2 mt-1">
        {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleTestSample(sample)}
            className="flex flex-col items-start gap-1 p-3 rounded-xl border border-border/80 bg-secondary/40 hover:bg-secondary hover:border-primary/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {sample.title}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {sample.sampleName}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              &quot;{sample.text}&quot;
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
