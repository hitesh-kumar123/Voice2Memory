# Voice2Memory: Turn Voice Notes into Structured, Searchable Memories with Open-Source AI

*Built for Hacktoberfest 2026 DEV Weekend Challenge #1 — "Build for a Friend"*

---

## 🎙️ The Friend Problem

My friend records dozens of voice notes every week. While walking the dog, commuting, or between meetings, they speak thoughts into their phone:

> *"Hey, remember to finalize the pitch deck with Sarah by Thursday at 4 PM, and schedule the follow-up client meeting for next Monday. Also, don't forget to order a new microphone for the podcast setup."*

The problem? **Voice notes are write-only memory.** 

Two days later, when they actually need to do the work, finding that one specific deadline means **replaying a 4-minute recording at 1x speed**. Tasks get lost, dates get missed, and useful ideas vanish into an endless list of unlabelled audio files.

I built **Voice2Memory** to solve this: a tool that converts spoken voice recordings into clean, structured, actionable memories using **100% open-source AI**.

---

## ✨ What Voice2Memory Does

Instead of an unorganized audio archive, Voice2Memory automatically turns voice notes into structured items:

- 📌 **Title**: Clear, high-level summary header (e.g. *"Pitch Deck Review and Podcast Setup"*)
- 📝 **Summary**: 1-2 sentence digest
- ✅ **Actionable Tasks**: Checkable todo items (*"Finalize pitch deck with Sarah by Thursday at 4 PM"*, *"Order new microphone"*)
- 📅 **Important Dates & Times**: Extracted deadlines (*"Thursday at 4 PM"*, *"next Monday"*)
- 👤 **People Mentioned**: (*"Sarah"*)
- 🏷️ **Topics**: Tagged categories (*"#Podcasts", "#Pitch Deck", "#Client Work"*)
- 🎙️ **Full Transcript**: Searchable speech text with word counts and playback

---

## 🏗️ How It Works: The Local AI Architecture

Voice2Memory operates with a 3-tier local pipeline:

```
[Browser Mic / File Upload] 
       ↓ (Audio Buffer)
[Next.js API Route: /api/transcribe]
       ↓ (faster-whisper / int8 quantization)
[Speech Transcript]
       ↓ (POST /api/analyze)
[Ollama Engine: Qwen 2.5 LLM]
       ↓ (JSON Schema Enforcement)
[Structured Memory Object]
       ↓ (POST /api/memories)
[MongoDB Database with Text Search]
```

### 1. High-Speed Speech-to-Text with Whisper
We use `faster-whisper` (CTranslate2 backend with 8-bit quantization and PyAV). It processes a 30-second audio clip on CPU in ~1.5 seconds, running completely offline with Voice Activity Detection (VAD) to filter background silence.

### 2. Structured Memory Extraction with Ollama & Qwen 2.5
We run `qwen2.5:1.5b` locally via **Ollama**. Unlike standard conversational chatbots, Voice2Memory acts as a deterministic extraction engine with JSON mode enabled.

System Prompt snippet:
```json
{
  "title": "Clean, concise title (4-8 words)",
  "summary": "1-2 sentence overview",
  "tasks": ["Actionable todo item 1", "Actionable todo item 2"],
  "importantDates": ["Explicitly mentioned dates/times"],
  "people": ["Names of individuals mentioned"],
  "topics": ["Relevant category tags"]
}
```

### 3. Local Search & Persistence with MongoDB
Memories are stored in a local MongoDB collection with multi-field text indexing. Searching for a person's name or keyword instantly surfaces every related note without requiring external cloud search services.

---

## 🔒 Why Open-Source AI Matters for Personal Memory

Voice notes often contain raw thoughts: personal finances, health updates, candid workplace feedback, and unreleased product roadmaps.

Sending private voice notes to proprietary third-party cloud APIs poses real privacy risks. By pairing **Whisper** and **Ollama**:
1. **Voice data never leaves the local machine**.
2. **Zero per-minute transcription costs**.
3. **No vendor lock-in** — users can switch between Whisper models (`tiny`, `base`, `small`) or LLMs (`qwen2.5`, `gemma2`, `llama3.2`) with a single environment variable change.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Speech Processing**: Whisper (`faster-whisper` 1.2.1)
- **Local LLM**: Ollama (`qwen2.5:1.5b`)
- **Database**: MongoDB with Mongoose ODM

---

## 💡 What I Learned & Challenges Overcome

1. **Deterministic JSON from Open-Weight LLMs**: Small models can occasionally slip conversational filler into JSON responses. We implemented a resilient recovery parser in `src/lib/ollama.ts` that handles markdown fences, balanced brace extraction, and schema field normalization.
2. **Windows OpenMP & Python Concurrency**: Concurrently loading PyTorch and CTranslate2 on Windows produced an OpenMP duplicate DLL conflict (`OMP: Error #15`). Setting `KMP_DUPLICATE_LIB_OK="TRUE"` in the subprocess environment resolved the issue cleanly.
3. **React 19 & SSR Hydration Safety**: Used `useSyncExternalStore` for browser capability checks to eliminate hydration mismatches while maintaining zero lint warnings.

---

## 🎥 Live Demo Walkthrough

1. Navigate to **New Note** (`/record`).
2. Record a 10-second voice note mentioning tasks and deadlines.
3. Click **"Process voice"** → Watch the live progression: `Uploading...` → `Transcribing with Whisper...` → `Analyzing with Ollama...`.
4. Review the structured memory with extracted tasks, dates, and people.
5. Click **"Save to Memories"** → Search and filter across your memory collection at `/memories`.

---

## 🔗 Repository & Links

- **GitHub Repository**: [Voice2Memory on GitHub](https://github.com/your-username/voice2memory)
- **DEV Challenge**: [Hacktoberfest 2026 DEV Weekend Challenge #1: "Build for a Friend"](https://dev.to/challenges/hacktoberfest-2026-1)

---

> 💡 **DevRelay Note**: The interactive AI pair-programming agent session transcript for this project was recorded and can be viewed or embedded into DEV articles using DevRelay.
