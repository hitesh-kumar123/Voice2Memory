import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VoiceRecorder from "@/components/recording/VoiceRecorder";
import UploadAudio from "@/components/recording/UploadAudio";
import SampleNoteTester from "@/components/recording/SampleNoteTester";
import { BrainIcon, MicIcon, UploadIcon, ZapIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Capture Voice Note | Voice2Memory",
  description: "Record voice notes, upload audio, or test sample audio to extract structured tasks, dates, and people with Google Gemma 2.",
};

export default function RecordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main
        id="record-main"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center"
      >
        {/* Page heading */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
            <BrainIcon className="w-3.5 h-3.5" />
            <span>Open-Weight AI Pipeline · Google Gemma 2</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Capture Voice Memory
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Record spontaneous thoughts, upload audio files, or run interactive sample scenarios.
          </p>
        </div>

        {/* Record section */}
        <section aria-labelledby="record-section-heading" className="w-full mb-12 flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            <MicIcon className="w-4 h-4 text-primary" />
            <span id="record-section-heading">Record Microphone Stream</span>
          </div>
          <div className="w-full flex justify-center">
            <VoiceRecorder />
          </div>
        </section>

        {/* Divider */}
        <div className="w-full flex items-center justify-center my-6" aria-hidden="true">
          <div className="h-px bg-border/60 flex-1" />
          <span className="px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
            or upload file
          </span>
          <div className="h-px bg-border/60 flex-1" />
        </div>

        {/* Upload section */}
        <section
          id="upload"
          aria-labelledby="upload-section-heading"
          className="w-full mb-12 flex flex-col items-center"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            <UploadIcon className="w-4 h-4 text-primary" />
            <span id="upload-section-heading">Upload Audio File</span>
          </div>
          <div className="w-full flex justify-center">
            <UploadAudio />
          </div>
        </section>

        {/* Divider */}
        <div className="w-full flex items-center justify-center my-6" aria-hidden="true">
          <div className="h-px bg-border/60 flex-1" />
          <span className="px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
            or instant test
          </span>
          <div className="h-px bg-border/60 flex-1" />
        </div>

        {/* Quick Demo Section */}
        <section aria-labelledby="sample-section-heading" className="w-full">
          <SampleNoteTester />
        </section>
      </main>
    </div>
  );
}
