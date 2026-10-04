// ─── Core domain types for Voice2Memory ──────────────────────────────────

/** A single extracted memory, stored in MongoDB */
export interface Memory {
  _id?: string;
  title: string;
  transcript: string;
  summary: string;
  tasks: string[];
  dates: string[];
  importantDates?: string[];
  people: string[];
  topics: string[];
  audioFileName?: string;
  audioDuration?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

/** What the Whisper API route returns */
export interface TranscriptResult {
  success: boolean;
  transcript: string;
  language?: string;
  languageProbability?: number;
  duration?: number;
  durationSeconds?: number;
  segments?: TranscriptSegment[];
  error?: string;
}

/** What the Ollama analysis API route returns */
export interface AnalysisResult {
  success?: boolean;
  title: string;
  summary: string;
  tasks: string[];
  dates: string[];
  importantDates?: string[];
  people: string[];
  topics: string[];
  error?: string;
}

/** API error shape */
export interface ApiError {
  error: string;
  details?: string;
}

// ─── UI-only state types (no backend) ────────────────────────────────────

/**
 * VoiceRecorder state machine
 *  idle        → waiting for user to click record
 *  requesting  → awaiting mic permission from browser
 *  recording   → actively capturing audio
 *  done        → recording stopped, audio available for preview
 *  processing  → "Process Voice" clicked; placeholder until Phase 4
 *  error       → something went wrong (see RecordingError)
 */
export type RecordingState =
  | "idle"
  | "requesting"
  | "recording"
  | "done"
  | "processing"
  | "error";

/**
 * Structured recording errors — each maps to a distinct UI message.
 */
export type RecordingError =
  | "permission-denied"   // user blocked mic
  | "not-supported"       // MediaRecorder unavailable in this browser
  | "no-device"           // no mic detected
  | "record-failed"       // MediaRecorder threw during capture
  | "unknown";

/**
 * UploadAudio state machine
 *  empty       → nothing selected yet
 *  selected    → valid file chosen, preview available
 *  processing  → "Process Voice" clicked; placeholder until Phase 4
 */
export type UploadState = "empty" | "selected" | "processing";

/** Generic async data-fetching state */
export type LoadingState = "idle" | "loading" | "success" | "error";

/** A queued audio source — either a recorded Blob or an uploaded File */
export interface AudioSource {
  type: "recording" | "upload";
  blob: Blob;
  /** Human-readable name shown in the UI */
  name: string;
  /** Bytes */
  size: number;
  /** Object URL for <audio> preview — call URL.revokeObjectURL when done */
  objectUrl: string;
}
