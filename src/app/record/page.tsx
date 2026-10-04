import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import VoiceRecorder from "@/components/recording/VoiceRecorder";
import UploadAudio from "@/components/recording/UploadAudio";
import SampleNoteTester from "@/components/recording/SampleNoteTester";

export const metadata: Metadata = {
  title: "New Note | Voice2Memory",
  description: "Record a voice note or upload an audio file to extract structured memories with Google Gemma 2.",
};

export default function RecordPage() {
  return (
    <>
      <Header />
      <main
        id="record-main"
        className="flex-1 max-w-2xl mx-auto w-full px-6 py-16"
      >
        {/* Page heading */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-3 border border-border">
            <span>🧠</span> Powered by Google Gemma 2
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            New voice note
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Record voice, upload an audio clip, or try a sample note to extract memories.
          </p>
        </div>

        {/* Record section */}
        <section aria-labelledby="record-section-heading" className="mb-12">
          <h2
            id="record-section-heading"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8 text-center"
          >
            Record with Microphone
          </h2>
          <div className="flex justify-center">
            <VoiceRecorder />
          </div>
        </section>

        {/* Divider */}
        <div className="divider mb-12" aria-hidden="true">
          or upload audio
        </div>

        {/* Upload section */}
        <section
          id="upload"
          aria-labelledby="upload-section-heading"
          className="mb-12"
        >
          <h2
            id="upload-section-heading"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8 text-center"
          >
            Upload audio file
          </h2>
          <div className="flex justify-center">
            <UploadAudio />
          </div>
        </section>

        {/* Divider */}
        <div className="divider mb-12" aria-hidden="true">
          or test instant sample
        </div>

        {/* Quick Demo Section */}
        <section aria-labelledby="sample-section-heading">
          <SampleNoteTester />
        </section>
      </main>
    </>
  );
}
