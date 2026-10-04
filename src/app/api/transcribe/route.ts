import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".m4a",
  ".webm",
  ".ogg",
  ".flac",
  ".aac",
]);

function getExtension(fileName: string, mimeType: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;

  if (mimeType.includes("webm")) return ".webm";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return ".m4a";
  if (mimeType.includes("wav")) return ".wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return ".mp3";
  if (mimeType.includes("ogg")) return ".ogg";
  if (mimeType.includes("flac")) return ".flac";

  return ".webm"; // default
}

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await req.formData();
    const audioFile = (formData.get("audio") || formData.get("file")) as File | null;

    if (!audioFile) {
      return NextResponse.json(
        {
          success: false,
          error: "No audio file provided. Please attach an audio file.",
        },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The audio file is empty (0 bytes).",
        },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Audio file exceeds maximum size limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        },
        { status: 413 }
      );
    }

    // Write file to temporary folder
    const ext = getExtension(audioFile.name || "audio.webm", audioFile.type || "audio/webm");
    const tempFileName = `v2m_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempFilePath, buffer);

    // Path to transcribe python script
    const scriptPath = path.join(process.cwd(), "scripts", "transcribe.py");
    const pythonExecutable = process.env.PYTHON_PATH || "python";

    // Run Python Whisper transcription with a 60-second timeout
    const result = await new Promise<{
      success: boolean;
      transcript?: string;
      language?: string;
      language_probability?: number;
      duration?: number;
      segments?: Array<{ start: number; end: number; text: string }>;
      error?: string;
    }>((resolve, reject) => {
      const child = spawn(/*turbopackIgnore: true*/ pythonExecutable, [scriptPath, tempFilePath!], {
        env: {
          ...process.env,
          KMP_DUPLICATE_LIB_OK: "TRUE",
          PYTHONIOENCODING: "utf-8",
        },
      });

      let stdoutData = "";
      let stderrData = "";

      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("Whisper transcription timed out after 60 seconds"));
      }, 60000);

      child.stdout.on("data", (data) => {
        stdoutData += data.toString("utf-8");
      });

      child.stderr.on("data", (data) => {
        stderrData += data.toString("utf-8");
      });

      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0 && !stdoutData.trim()) {
          reject(
            new Error(
              `Whisper process exited with code ${code}: ${stderrData.trim() || "Unknown error"}`
            )
          );
          return;
        }

        try {
          // Parse the JSON output from stdout
          const jsonStartIndex = stdoutData.indexOf("{");
          const jsonEndIndex = stdoutData.lastIndexOf("}");
          if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            reject(
              new Error(
                `Failed to parse Whisper output: ${stdoutData || stderrData}`
              )
            );
            return;
          }

          const cleanJson = stdoutData.substring(jsonStartIndex, jsonEndIndex + 1);
          const parsed = JSON.parse(cleanJson);
          resolve(parsed);
        } catch (parseErr) {
          reject(
            new Error(
              `Invalid JSON from Whisper script: ${String(parseErr)}. Output: ${stdoutData}`
            )
          );
        }
      });

      child.on("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Transcription failed",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript || "",
      language: result.language || "en",
      languageProbability: result.language_probability,
      duration: result.duration,
      durationSeconds: result.duration,
      segments: result.segments || [],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during transcription";
    console.error("[/api/transcribe Error]:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  } finally {
    // Always clean up temp file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignore deletion errors on temp file
      }
    }
  }
}
