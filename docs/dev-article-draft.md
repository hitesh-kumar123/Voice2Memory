---
title: "Voice2Memory: Turn Voice Notes into Structured, Searchable Memories with Google Gemma 2 & MongoDB Atlas"
published: true
description: "Open-weight AI personal memory vault turning voice notes into tasks, dates, people, and topics using Google Gemma 2, Faster-Whisper, and MongoDB Atlas."
tags: devchallenge, hacktoberfest, gemma, mongodb
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01)*

## What I Built

I built **Voice2Memory** for my friend Alex, a founder and product manager who records dozens of audio voice notes every single week while commuting, walking the dog, or rushing between meetings. 

A typical voice note from Alex sounds like this:
> *"Hey Sarah, I'm heading over to the office now. Please remember to finalize the Q4 investor pitch deck with Alex by Thursday at 4 PM. We also need to schedule the follow-up meeting with Priya for next Monday afternoon. On my way back I have to order a new microphone for our podcast setup and email the contract to Tom."*

### The Problem
Voice notes are **write-only memory**. Days later, finding a specific task, deadline, or promise meant replaying minutes of audio at 1x speed. Crucial commitments got lost, deadlines were missed, and valuable context remained trapped in unlabelled audio files.

### The Solution
**Voice2Memory** converts unstructured voice notes into structured, searchable personal memories in seconds:
- **Concise Title**: Clean 4–8 word executive header.
- **Executive Summary**: 1–2 sentence synthesis.
- **Actionable Tasks**: Checkable todo items with real-time state sync to the database.
- **Important Dates & Deadlines**: Temporal entity extraction (*"Thursday at 4 PM"*, *"next Monday"*).
- **People Mentioned**: Automatic contact detection (*"Sarah"*, *"Alex"*, *"Priya"*, *"Tom"*).
- **Categorical Topics**: Automatic tagging (*"#Finance"*, *"#PitchDeck"*, *"#Podcast"*).
- **Voice Narration**: Hands-free audio briefing of the summary using ElevenLabs TTS / Web Speech.
- **Markdown Export**: One-click export for Obsidian and Notion.

---

## Demo

- **Live Web Application**: [https://voice2memory.onrender.com](https://voice2memory.onrender.com) *(or your Render deployment URL)*
- **GitHub Repository**: [https://github.com/hitesh-kumar123/Voice2Memory](https://github.com/hitesh-kumar123/Voice2Memory)

### Interactive Walkthrough
1. **Capture**: Record audio via browser microphone, drag-and-drop an audio file (MP3, WAV, M4A, WebM, FLAC), or choose an **Interactive Sample Scenario**.
2. **Process**: Watch the live pipeline progress through `Uploading` → `Transcribing with Whisper` → `Structuring with Google Gemma 2`.
3. **Review**: Inspect the extracted tasks, dates, and people; listen to the executive voice summary.
4. **Vault & Sync**: Save to MongoDB Atlas; search and check off completed tasks in real-time.

---

## Code

{% github https://github.com/hitesh-kumar123/Voice2Memory %}

---

## How I Built It

Voice2Memory is built around a modern open-weight AI architecture and full-stack pipeline:

```
[Browser Mic / Audio File Upload] 
       ↓ (Audio Buffer)
[Next.js API Route: /api/transcribe]
       ↓ (Faster-Whisper int8 / CTranslate2 + VAD)
[Speech Transcript + Timestamps]
       ↓ (POST /api/analyze)
[Google Gemma 2 LLM (gemma2:2b) via Ollama]
       ↓ (Strict JSON Schema Enforcement & Recovery)
[Structured Memory Object]
       ↓ (POST /api/memories)
[MongoDB Atlas Database with Weighted Text Search]
       ↓ (POST /api/tts)
[ElevenLabs TTS Narration Audio Stream]
```

### 1. Open-Weight AI Brain: Google Gemma 2 (`gemma2:2b`)
We run Google's **Gemma 2** (`gemma2:2b`) via **Ollama**. Gemma 2's instruction-tuned architecture with sliding window attention and logit soft-capping provides exceptional entity extraction with minimal memory footprint (~1.6 GB VRAM).
- **Instruction Prompt Templating**:
  ```text
  <start_of_turn>user
  You are an expert AI Memory Extraction engine for Voice2Memory powered by Google Gemma 2.
  Spoken Voice Note Transcript:
  "{transcript}"
  Extract the structured memory JSON now:<end_of_turn>
  <start_of_turn>model
  ```
- **Resilient Multi-Stage JSON Recovery**: Implemented in `src/lib/ollama.ts` to guarantee deterministic JSON output, stripping markdown code fences and balancing curly braces.

### 2. Speech-to-Text: OpenAI Faster-Whisper
Audio files and live microphone recordings are transcribed locally using `faster-whisper` with 8-bit quantization (`int8`) and Voice Activity Detection (VAD) to filter background noise.

### 3. Database Layer: MongoDB Atlas
- **Connection Architecture**: Connection pooling with automatic Google/Cloudflare DNS resolver fallback (`8.8.8.8`, `1.1.1.1`) to prevent `querySrv` connection drops.
- **Weighted Multi-Field Text Search Index**:
  ```typescript
  MemorySchema.index(
    { title: "text", summary: "text", transcript: "text", topics: "text", people: "text" },
    { weights: { title: 10, topics: 5, summary: 4, people: 3, transcript: 1 } }
  );
  MemorySchema.index({ createdAt: -1, topics: 1 });
  ```
- **Real-Time Task Sync**: Toggling task checkboxes immediately synchronizes with MongoDB Atlas via `PATCH /api/memories/[id]`.

### 4. Frontend & UI/UX Design System
- **Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **Aesthetic**: Linear/Awwwards-tier dark glassmorphism design with Tailwind CSS 4 and crisp Lucide vector icons (zero tacky emojis).

---

## Why Does Open Innovation Matter?

Voice notes are deeply personal. They contain unpolished thoughts, medical appointments, client discussions, financial numbers, and confidential ideas.

Closed, proprietary cloud AI APIs create significant challenges:
1. **Privacy Risks**: Uploading private voice notes to proprietary clouds creates data sovereignty and compliance risks.
2. **High Recurring Token Costs**: Pay-per-minute transcription fees and pay-per-token API calls make continuous voice logging prohibitively expensive.
3. **Vendor Lock-in**: Closed models change behavior without warning.

With open innovation (**Faster-Whisper + Google Gemma 2**):
- Audio and transcripts stay completely private.
- Inference runs locally at near-zero incremental cost.
- Anyone can audit, self-host, and scale from `gemma2:2b` to `gemma2:9b` or `gemma2:27b` without changing the application code.

---

## My Agent Session

This project was pair-programmed using the **Antigravity AI Agent** to accelerate the implementation of the Gemma 2 multi-stage parser, MongoDB Atlas connection pooling with DNS fallback, and the Next.js 16 full-stack architecture.

---

## Prize Categories

### 1. Best Use of Gemma ($200)
- **Model**: Google Gemma 2 (`gemma2:2b` open-weight model).
- **Implementation**: Drives all spoken transcript understanding, executive summarization, action item extraction, temporal date recognition, and topic categorization in `src/lib/ollama.ts` and `src/app/api/analyze/route.ts`.

### 2. Best Use of MongoDB Atlas ($100)
- **Implementation**: MongoDB Atlas serves as the central persistent memory store with weighted compound text search indexing, connection pooling, and real-time task checklist synchronization (`PATCH /api/memories/[id]`).
