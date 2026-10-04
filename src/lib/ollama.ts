import type { AnalysisResult } from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma2:2b";
const GEMMA_API_BASE = process.env.GEMMA_API_BASE || process.env.OPENAI_API_BASE;
const GEMMA_API_KEY = process.env.GEMMA_API_KEY || process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are an expert AI Memory Extraction engine for Voice2Memory powered by Google Gemma 2.
Your mission is to analyze a spoken voice note transcript and extract structured personal memory items.

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
 * Checks if the local Ollama / Gemma server is running and reachable.
 */
export async function checkOllamaHealth(): Promise<{
  available: boolean;
  models: string[];
  selectedModel: string;
  provider: string;
  error?: string;
}> {
  // If remote OpenAI-compatible Gemma endpoint is configured
  if (GEMMA_API_BASE) {
    return {
      available: true,
      models: [OLLAMA_MODEL],
      selectedModel: OLLAMA_MODEL,
      provider: "OpenAI-compatible Gemma Endpoint",
    };
  }

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
        provider: "Ollama Local (Gemma 2)",
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
      provider: "Ollama Local (Google Gemma 2)",
    };
  } catch (err: unknown) {
    return {
      available: false,
      models: [],
      selectedModel: OLLAMA_MODEL,
      provider: "Ollama Local (Google Gemma 2)",
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
export function validateAndNormalizeMemory(
  raw: Record<string, unknown>,
  modelUsed: string = OLLAMA_MODEL
): AnalysisResult {
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

  const tasks = toCleanStringArray(raw.tasks || raw.actionItems || raw.action_items);
  const importantDates = toCleanStringArray(
    raw.importantDates || raw.important_dates || raw.dates
  );
  const people = toCleanStringArray(raw.people || raw.persons || raw.names);
  const topics = toCleanStringArray(raw.topics || raw.tags || raw.categories);

  return {
    success: true,
    title,
    summary,
    tasks,
    dates: importantDates,
    importantDates,
    people,
    topics: topics.length > 0 ? topics : ["General"],
    modelUsed,
  };
}

/**
 * Fallback heuristic extractor if LLM is offline or fails, ensuring zero UI crashes.
 */
export function extractHeuristicMemory(transcript: string): AnalysisResult {
  const clean = transcript.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  const title = words.length > 0 ? words.slice(0, 6).join(" ") + "…" : "Voice Note";
  const summary = clean.length > 0 ? clean : "No transcript available.";

  // Simple task detection
  const tasks: string[] = [];
  const lines = clean.split(/[.!?\n]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (
      /^(need to|have to|must|remember to|call|send|buy|meet|finish|prepare|review|schedule|follow up|order)/i.test(
        line
      )
    ) {
      tasks.push(line);
    }
  }

  // Simple date detection
  const dates: string[] = [];
  const dateMatches = clean.match(
    /\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|night|next week|at \d{1,2}(?::\d{2})?\s*(?:am|pm)?|oct \d{1,2}|nov \d{1,2}|dec \d{1,2})\b/gi
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
    modelUsed: "heuristic-fallback",
  };
}

/**
 * Sends a transcript to Google Gemma 2 (via Ollama or remote OpenAI-compatible API)
 * for structured memory extraction.
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
      modelUsed: "none",
      error: "Empty transcript",
    };
  }

  const modelToUse = modelOverride || OLLAMA_MODEL;

  // 1. Remote OpenAI-compatible Gemma Endpoint (e.g. DigitalOcean GPU droplet or Hugging Face)
  if (GEMMA_API_BASE) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const endpoint = `${GEMMA_API_BASE.replace(/\/+$/, "")}/chat/completions`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(GEMMA_API_KEY ? { Authorization: `Bearer ${GEMMA_API_KEY}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Spoken Voice Note Transcript:\n"${trimmed}"\n\nExtract the structured memory JSON now:`,
            },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        if (content) {
          const parsed = cleanAndParseJson(content);
          return validateAndNormalizeMemory(parsed, `Gemma 2 (${modelToUse})`);
        }
      }
    } catch (err) {
      console.warn(
        `[Remote Gemma Notice]: ${err instanceof Error ? err.message : "Remote error"}. Trying local Ollama...`
      );
    }
  }

  // 2. Local Ollama Gemma 2 pipeline with Gemma prompt templating
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

    // Gemma 2 instruction formatting for optimal token attention
    const promptText = `<start_of_turn>user\n${SYSTEM_PROMPT}\n\nSpoken Voice Note Transcript:\n"${trimmed}"\n\nExtract the structured memory JSON now:<end_of_turn>\n<start_of_turn>model\n`;

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
    return validateAndNormalizeMemory(parsedJson, `Google Gemma 2 (${modelToUse})`);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to analyze transcript with Gemma 2";
    console.warn(
      `[Gemma 2 Analysis Notice]: ${errorMsg}. Falling back to safe heuristic extraction.`
    );

    const fallback = extractHeuristicMemory(transcript);
    return {
      ...fallback,
      modelUsed: `Heuristic Fallback (${modelToUse} offline)`,
      error: `Local LLM (${modelToUse}) notice: ${errorMsg}`,
    };
  }
}
