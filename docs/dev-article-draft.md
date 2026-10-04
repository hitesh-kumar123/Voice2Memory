# Voice2Memory: Turn Voice Notes into Structured, Searchable Memories with Google Gemma 2 & MongoDB Atlas

*Built for Hacktoberfest 2026 DEV Weekend Challenge #1 — "Build for a Friend"*

---

## 🎙️ The Friend Problem

My friend Alex records dozens of voice notes every week. While walking the dog, commuting between meetings, or pacing the hallway, they speak stream-of-consciousness thoughts into their phone:

> *"Hey, remember to finalize the pitch deck with Sarah by Thursday at 4 PM, and schedule the follow-up client meeting with Priya for next Monday. Also, don't forget to order a new microphone for the podcast setup and confirm Dr. Gupta's appointment on Friday."*

The fundamental problem? **Voice notes are write-only memory.**

Two days later, when they actually sit down to execute, finding that one specific deadline means **replaying a 4-minute recording at 1x speed**. Tasks get lost, dates get missed, and useful ideas vanish into an endless list of unlabelled audio files.

I built **Voice2Memory** to solve this: a tool that converts spoken voice recordings into clean, structured, actionable memories using **100% open-weight AI**.

---

## ✨ What Voice2Memory Does

Instead of an unorganized audio archive, Voice2Memory automatically turns voice notes into structured items:

- 📌 **Title**: Clear, high-level summary header (*"Pitch Deck Review, Client Sync, and Podcast Setup"*)
- 📝 **Summary**: 1–2 sentence executive digest
- ✅ **Actionable Tasks**: Interactive checkable todo items with live database state persistence (*"Finalize pitch deck with Sarah by Thursday at 4 PM"*, *"Order new microphone"*)
- 📅 **Important Dates & Deadlines**: Temporal entity extraction (*"Thursday at 4 PM"*, *"next Monday", "Friday"*)
- 👤 **People Mentioned**: (*"Sarah"*, *"Priya"*, *"Dr. Gupta"*)
- 🏷️ **Topics**: Tagged categories (*"#ClientWork", "#PitchDeck", "#Podcast"*)
- 🔊 **Voice Narration**: Hands-free audio briefing of the summary using **ElevenLabs** / Web Speech API
- 📋 **Markdown Export**: Direct copy formatted for Obsidian and Notion

---

## 🏗️ How It Works: Open-Weight AI Architecture

Voice2Memory operates with a 4-tier pipeline:

```
[Browser Mic / File Upload] 
       ↓ (Audio Buffer)
[Next.js API Route: /api/transcribe]
       ↓ (faster-whisper / int8 quantization)
[Speech Transcript + Timestamps]
       ↓ (POST /api/analyze)
[Google Gemma 2 LLM via Ollama / DO GPU Droplet]
       ↓ (JSON Schema Enforcement & Recovery)
[Structured Memory Object]
       ↓ (POST /api/memories)
[MongoDB Atlas Database with Compound Text Indexes]
       ↓ (POST /api/tts)
[ElevenLabs TTS Narration Audio Stream]
```

### 1. High-Speed Speech-to-Text with Faster-Whisper
We use `faster-whisper` (CTranslate2 backend with 8-bit quantization and PyAV). It processes a 30-second audio clip on CPU in ~1.5 seconds, running completely offline with Voice Activity Detection (VAD) to filter background silence.

### 2. Structured Memory Extraction with Google Gemma 2
We run **Google Gemma 2** (`gemma2:2b`) locally via **Ollama** or on a **DigitalOcean GPU Droplet**. Unlike conversational chatbots, Voice2Memory uses Gemma 2 as a deterministic JSON extraction engine with strict schema enforcement.

Gemma 2 Prompt Formatting:
```text
<start_of_turn>user
You are an expert AI Memory Extraction engine for Voice2Memory powered by Google Gemma 2.
Spoken Voice Note Transcript:
"{transcript}"
Extract the structured memory JSON now:<end_of_turn>
<start_of_turn>model
```

### 3. Persistent Storage & Search with MongoDB Atlas
Memories are stored in a **MongoDB Atlas** cluster with weighted text search and compound indexing. Searching for a person's name or keyword instantly surfaces every related note. Checked tasks are persisted back to MongoDB Atlas with `PATCH /api/memories/[id]`.

### 4. Hands-Free Summary Narration with ElevenLabs
When the friend is driving or multitasking, they can click **"Listen to summary"** to have their Gemma 2 executive summary read aloud via **ElevenLabs TTS** (with automatic Web Speech API fallback).

---

## 🔒 Why Open-Source & Open-Weight AI Matters

Voice notes often contain raw thoughts: personal finances, health updates, candid workplace feedback, and unreleased product roadmaps.

Sending private voice notes to proprietary third-party cloud APIs poses real privacy risks. By pairing **Faster-Whisper** and **Google Gemma 2**:
1. **Voice data never leaves the local machine / private droplet**.
2. **Zero per-minute transcription costs**.
3. **No vendor lock-in** — developers can scale from `gemma2:2b` to `gemma2:9b` or `gemma2:27b` without changing application code.

---

## 🏆 Hacktoberfest Partner Technologies

1. **Best Use of Gemma ($200)**:
   Google Gemma 2 (`gemma2:2b`) powers the core entity extraction, task identification, and summarization pipeline. Gemma 2's lightweight parameter efficiency (~1.6 GB memory) and high instruction-following fidelity make it the ideal model for local, private personal memory structuring.

2. **Best Use of MongoDB Atlas ($100)**:
   MongoDB Atlas is used as the persistent memory storage layer with weighted text search indexes across titles, summaries, transcripts, people, and topics, plus real-time task state persistence.

3. **Best Use of DigitalOcean ($200)**:
   DigitalOcean App Platform spec (`.do/app.yaml`), multi-stage `Dockerfile`, `docker-compose.yml`, and an automated GPU Droplet setup script (`deploy/digitalocean-gpu-setup.sh`) enable full production deployment of the web app, Whisper worker, and Gemma 2 GPU host.

4. **Optional Partner Technology: ElevenLabs**:
   Integrated via `/api/tts` to provide crystal-clear voice narration of structured summaries.

---

## 💡 What I Learned & Challenges Overcome

1. **Deterministic JSON from Open-Weight LLMs**: Small models can occasionally slip conversational filler into JSON responses. We implemented a resilient multi-stage recovery parser in `src/lib/ollama.ts` that handles markdown fences, balanced brace extraction, and schema field normalization.
2. **Windows OpenMP & Python Concurrency**: Concurrently loading PyTorch and CTranslate2 on Windows produced an OpenMP duplicate DLL conflict (`OMP: Error #15`). Setting `KMP_DUPLICATE_LIB_OK="TRUE"` in the subprocess environment resolved the issue cleanly.
3. **React 19 & SSR Hydration Safety**: Used `useSyncExternalStore` for browser capability checks to eliminate hydration mismatches while maintaining zero lint warnings.

---

## 🎥 Live Demo Walkthrough

1. Navigate to **New Note** (`/record`).
2. Record a voice note, upload an audio file, or click one of the 3 **Quick Demo Samples** (e.g. *Alex's Pitch Deck Sync*).
3. Click **"Process voice"** → Watch the live progression: `Uploading...` → `Transcribing with Whisper...` → `Structuring with Google Gemma 2...`.
4. Review the structured memory with extracted tasks, dates, and people.
5. Click **"Listen to summary"** for audio narration.
6. Click **"Save to Memories"** → Search, filter, and check off completed tasks at `/memories`.

---

## 🔗 Repository & Links

- **GitHub Repository**: [Voice2Memory on GitHub](https://github.com/hitesh-kumar123/Voice2Memory)
- **DEV Challenge**: [Hacktoberfest 2026 DEV Weekend Challenge: "Build for a Friend"](https://dev.to/challenges/hacktoberfest-2026-1)
- **Google Gemma 2**: [ai.google.dev/gemma](https://ai.google.dev/gemma)
- **MongoDB Atlas**: [mongodb.com/atlas](https://www.mongodb.com/atlas)
- **DigitalOcean**: [digitalocean.com](https://www.digitalocean.com/)
