import type { AnalysisResult } from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

const SYSTEM_PROMPT = `You are an expert AI Memory Extraction engine for Voice2Memory.
Your job is to analyze a spoken voice note transcript and extract structured personal memory items.

CRITICAL EXTRACTION RULES:
1. ONLY extract information that is explicitly stated or directly inferred from the transcript.
2. NEVER hallucinate or invent people, tasks, dates, or topics.
3. TITLE: A clean, concise title (4-8 words) capturing the main subject.
4. SUMMARY: A clear 1-2 sentence overview of what the voice note is about.
5. TASKS: Array of actionable todo items (e.g. ["Call Rahul", "Send proposal to Amit"]). If no tasks exist, return [].
6. IMPORTANT DATES: Array of exact dates, times, days, or temporal references mentioned (e.g. ["tomorrow at 5 PM", "Friday", "Oct 15"]). If none mentioned, return [].
7. PEOPLE: Array of specific person names mentioned (e.g. ["Sarah", "Rahul"]). Do not include generic nouns like "friend" or "boss". If none mentioned, return [].
8. TOPICS: Array of 1-4 short categories/topics (e.g. ["Work", "Finance", "Personal", "Health", "Project"]).

RESPONSE FORMAT:
You MUST respond with valid, parseable JSON ONLY. Do not include introductory text, markdown fences, or commentary.
Schema:
{
  "title": "string",
  "summary": "string",
  "tasks": ["string"],
  "importantDates": ["string"],
  "people": ["string"],
  "topics": ["string"]
}`;

/**
 * Checks if the local Ollama server is running and reachable.
 */
export async function checkOllamaHealth(): Promise<{
  available: boolean;
  models: string[];
  selectedModel: string;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        available: false,
        models: [],
        selectedModel: OLLAMA_MODEL,
        error: `Ollama returned status ${res.status}`,
      };
    }

    const data = await res.json();
    const models = Array.isArray(data.models)
      ? data.models.map((m: { name?: string }) => m.name || "").filter(Boolean)
      : [];

    return {
      available: true,
      models,
      selectedModel: OLLAMA_MODEL,
    };
  } catch (err: unknown) {
    return {
      available: false,
      models: [],
      selectedModel: OLLAMA_MODEL,
      error: err instanceof Error ? err.message : "Ollama connection failed",
    };
  }
}

/**
 * Robust JSON extraction and recovery from model output.
 */
function cleanAndParseJson(text: string): Record<string, unknown> {
  // 1. Direct parse attempt
  try {
    return JSON.parse(text.trim());
  } catch {
    // Continue to recovery
  }

  // 2. Strip markdown code fences (```json ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // 3. Find outermost curly braces
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const jsonSubstring = text.substring(start, end + 1);
    try {
      return JSON.parse(jsonSubstring);
    } catch {
      // Continue
    }
  }

  throw new Error("Could not extract valid JSON from LLM output");
}

/**
 * Validates and normalizes the parsed JSON into an AnalysisResult.
 */
export function validateAndNormalizeMemory(raw: Record<string, unknown>): AnalysisResult {
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : "Voice Note Memory";

  const summary =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : "Voice recording transcript processed.";

  const toCleanStringArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((s) => s.length > 0);
  };

  const tasks = toCleanStringArray(raw.tasks);
  const importantDates = toCleanStringArray(raw.importantDates || raw.dates);
  const people = toCleanStringArray(raw.people);
  const topics = toCleanStringArray(raw.topics);

  return {
    success: true,
    title,
    summary,
    tasks,
    dates: importantDates,
    importantDates,
    people,
    topics: topics.length > 0 ? topics : ["General"],
  };
}

/**
 * Fallback heuristic extractor if LLM is offline or fails, ensuring no crashes.
 */
export function extractHeuristicMemory(transcript: string): AnalysisResult {
  const clean = transcript.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  
  const title = words.length > 0 ? words.slice(0, 6).join(" ") + "..." : "Voice Note";
  const summary = clean.length > 0 ? clean : "No transcript available.";

  // Simple task detection
  const tasks: string[] = [];
  const lines = clean.split(/[.!?\n]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (
      /^(need to|have to|must|remember to|call|send|buy|meet|finish|prepare|review|schedule)/i.test(
        line
      )
    ) {
      tasks.push(line);
    }
  }

  // Simple date detection
  const dates: string[] = [];
  const dateMatches = clean.match(
    /\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|night|next week|at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi
  );
  if (dateMatches) {
    dates.push(...Array.from(new Set(dateMatches.map((d) => d.trim()))));
  }

  return {
    success: true,
    title,
    summary,
    tasks,
    dates,
    importantDates: dates,
    people: [],
    topics: ["Voice Note"],
  };
}

/**
 * Sends a transcript to Ollama for structured memory extraction.
 */
export async function analyzeTranscriptWithOllama(
  transcript: string,
  modelOverride?: string
): Promise<AnalysisResult> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      success: false,
      title: "Empty Note",
      summary: "No speech or text provided to analyze.",
      tasks: [],
      dates: [],
      importantDates: [],
      people: [],
      topics: [],
      error: "Empty transcript",
    };
  }

  const modelToUse = modelOverride || OLLAMA_MODEL;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

    const promptText = `Transcript to analyze:\n"${trimmed}"\n\nExtract the structured memory JSON now:`;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelToUse,
        system: SYSTEM_PROMPT,
        prompt: promptText,
        format: "json",
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for deterministic structured extraction
          num_predict: 512,
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const rawResponseText = data.response || "";

    if (!rawResponseText.trim()) {
      throw new Error("Ollama returned an empty response.");
    }

    const parsedJson = cleanAndParseJson(rawResponseText);
    return validateAndNormalizeMemory(parsedJson);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to analyze transcript with Ollama";
    console.warn(`[Ollama Analysis Notice]: ${errorMsg}. Falling back to safe heuristic extraction.`);
    
    const fallback = extractHeuristicMemory(transcript);
    return {
      ...fallback,
      error: `Local LLM (${modelToUse}) notice: ${errorMsg}`,
    };
  }
}
