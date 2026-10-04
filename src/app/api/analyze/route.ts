import { NextRequest, NextResponse } from "next/server";
import { analyzeTranscriptWithOllama, checkOllamaHealth } from "@/lib/ollama";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.transcript !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid 'transcript' field in JSON request body.",
        },
        { status: 400 }
      );
    }

    const transcript = body.transcript.trim();

    if (!transcript) {
      return NextResponse.json(
        {
          success: false,
          error: "Transcript cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Run Ollama memory extraction
    const result = await analyzeTranscriptWithOllama(transcript, body.model);

    return NextResponse.json({
      success: true,
      title: result.title,
      summary: result.summary,
      tasks: result.tasks,
      importantDates: result.importantDates || result.dates,
      dates: result.dates || result.importantDates,
      people: result.people,
      topics: result.topics,
      modelUsed: result.modelUsed,
      error: result.error,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during memory analysis";
    console.error("[/api/analyze Error]:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const health = await checkOllamaHealth();
  return NextResponse.json(health);
}
