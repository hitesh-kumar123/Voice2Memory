# Voice2Memory Development Notes

## Project Overview
Voice2Memory converts voice notes into structured, searchable memories (Title, Summary, Tasks, Dates, People, Topics) using open-source AI (Whisper + Ollama) and MongoDB.

---

## Phases & Progress

### Phase 1: Frontend UI/UX
- Built modern, accessible, clean light-first interface using Tailwind CSS and Next.js App Router.
- Implemented Landing page, Record page, Memories list page, and individual Memory detail view.
- Added responsive layouts, subtle micro-interactions, loading skeletons, and accessible states.

### Phase 2: Real Audio Input
- Implemented `VoiceRecorder.tsx` with browser `MediaRecorder` API: start, stop, real-time timer, preview playback, and reset.
- Implemented `UploadAudio.tsx` with drag-and-drop, MIME/extension verification, and 50MB file size limits.
- Handled edge cases: microphone permission denial, unsupported browser fallback, corrupt files.

### Phase 3: Speech-to-Text with Whisper
- Integrated local open-source `faster-whisper` (CTranslate2 backend with `int8` CPU quantization).
- Built Next.js API route `POST /api/transcribe` handling multipart audio uploads and temp file lifecycle.
- Added live UI pipeline feedback (`Uploading...` -> `Transcribing...` -> `Transcript ready`).
- Supported language detection, duration estimation, and segment-level timestamps.

### Phase 4: Open-Source AI / Ollama Analysis
- Architecture: `src/lib/ollama.ts` + `POST /api/analyze`.
- Extractor: Structured memory extraction with zero hallucination guarantee.
- Output schema: `title`, `summary`, `tasks`, `importantDates`, `people`, `topics`.
- Safety: Robust JSON repair, strict fallback parsing, and field validation.

---

## Important Bugs & Fixes

### 1. React 19 Linting (`react-hooks/set-state-in-effect`)
- **Problem**: Calling `setSupported()` or `startTranscription()` synchronously within `useEffect` body caused ESLint `react-hooks/set-state-in-effect` errors.
- **Root Cause**: React 19 / React Compiler flags synchronous state setters inside effects as sources of cascading renders.
- **Fix**: Replaced client-side detection in `VoiceRecorder` with `useSyncExternalStore` (`useIsMounted()`), and refactored async data fetching in `TranscriptView` to clean cancelled-flag lifecycle.
- **Prevention**: Always use `useSyncExternalStore` or async effects with cancellation tokens for hydration-safe client checks.

### 2. OpenMP Duplicate Library on Windows with Whisper
- **Problem**: Python process crashed with `OMP: Error #15: Initializing libiomp5md.dll, but found libiomp5md.dll already initialized`.
- **Root Cause**: Multiple OpenMP runtimes linked when loading PyTorch and CTranslate2 concurrently on Windows.
- **Fix**: Added `os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"` at the top of `scripts/transcribe.py` and in Node `spawn` environment.
- **Prevention**: Always set `KMP_DUPLICATE_LIB_OK="TRUE"` for local Python ML subprocesses on Windows.
