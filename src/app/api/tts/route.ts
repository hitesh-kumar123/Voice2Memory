import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Default voice: "21m00Tcm4TlvDq8ikWAM" (Rachel) or configurable via env
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json(
        { success: false, error: "Text is required for speech synthesis." },
        { status: 400 }
      );
    }

    const text = body.text.trim().slice(0, 1500); // Guard against excessively large payloads

    // If ElevenLabs API Key is not configured, instruct frontend to use built-in browser Web Speech API
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({
        success: true,
        provider: "webspeech",
        text,
        message: "ElevenLabs API key not configured. Using browser Web Speech API fallback.",
      });
    }

    // Call ElevenLabs TTS REST API
    const voiceId = body.voiceId || ELEVENLABS_VOICE_ID;
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(elevenLabsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
        Accept: "audio/mpeg",
      },
      signal: controller.signal,
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(`[ElevenLabs API Warning]: ${response.status} - ${errorText}`);
      // Fallback to web speech rather than hard error
      return NextResponse.json({
        success: true,
        provider: "webspeech",
        text,
        fallbackReason: `ElevenLabs returned ${response.status}`,
      });
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return NextResponse.json({
      success: true,
      provider: "elevenlabs",
      audioUrl: audioDataUrl,
      text,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "TTS request failed";
    console.error("[/api/tts Error]:", errorMsg);

    return NextResponse.json({
      success: true,
      provider: "webspeech",
      fallbackReason: errorMsg,
    });
  }
}
