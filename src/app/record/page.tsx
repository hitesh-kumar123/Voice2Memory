import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import VoiceRecorder from "@/components/recording/VoiceRecorder";
import UploadAudio from "@/components/recording/UploadAudio";

export const metadata: Metadata = {
  title: "New Note",
  description: "Record a voice note or upload an audio file to create a structured memory.",
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
        <div className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            New note
          </h1>
          <p className="text-muted-foreground text-base">
            Record your voice or upload an existing audio file.
          </p>
        </div>

        {/* Record section */}
        <section aria-labelledby="record-section-heading" className="mb-12">
          <h2
            id="record-section-heading"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8"
          >
            Record
          </h2>
          <div className="flex justify-center">
            <VoiceRecorder />
          </div>
        </section>

        {/* Divider */}
        <div className="divider mb-12" aria-hidden="true">
          or
        </div>

        {/* Upload section */}
        <section
          id="upload"
          aria-labelledby="upload-section-heading"
          className="mb-8"
        >
          <h2
            id="upload-section-heading"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8"
          >
            Upload audio file
          </h2>
          <div className="flex justify-center">
            <UploadAudio />
          </div>
        </section>
      </main>
    </>
  );
}
