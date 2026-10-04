import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import MemoryModel from "@/models/Memory";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    let filter = {};

    if (query) {
      const regex = new RegExp(query, "i");
      filter = {
        $or: [
          { title: { $regex: regex } },
          { summary: { $regex: regex } },
          { transcript: { $regex: regex } },
          { topics: { $in: [regex] } },
          { people: { $in: [regex] } },
          { tasks: { $in: [regex] } },
        ],
      };
    }

    const memories = await MemoryModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const formatted = memories.map((m) => ({
      _id: m._id.toString(),
      title: m.title,
      summary: m.summary,
      transcript: m.transcript,
      tasks: m.tasks || [],
      dates: m.dates || m.importantDates || [],
      importantDates: m.importantDates || m.dates || [],
      people: m.people || [],
      topics: m.topics || [],
      audioFileName: m.audioFileName,
      audioDuration: m.audioDuration,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      memories: formatted,
      count: formatted.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database query failed";
    console.error("[GET /api/memories Error]:", errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        memories: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const {
      title,
      summary,
      transcript,
      tasks,
      dates,
      importantDates,
      people,
      topics,
      audioFileName,
      audioDuration,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 }
      );
    }

    if (!summary || typeof summary !== "string") {
      return NextResponse.json(
        { success: false, error: "Summary is required." },
        { status: 400 }
      );
    }

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { success: false, error: "Transcript is required." },
        { status: 400 }
      );
    }

    const finalDates = Array.isArray(importantDates)
      ? importantDates
      : Array.isArray(dates)
      ? dates
      : [];

    const newMemory = await MemoryModel.create({
      title: title.trim(),
      summary: summary.trim(),
      transcript: transcript.trim(),
      tasks: Array.isArray(tasks) ? tasks.map((t) => String(t).trim()).filter(Boolean) : [],
      dates: finalDates,
      importantDates: finalDates,
      people: Array.isArray(people) ? people.map((p) => String(p).trim()).filter(Boolean) : [],
      topics: Array.isArray(topics) ? topics.map((tp) => String(tp).trim()).filter(Boolean) : [],
      audioFileName: typeof audioFileName === "string" ? audioFileName : undefined,
      audioDuration: typeof audioDuration === "number" ? audioDuration : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        memory: {
          _id: newMemory._id.toString(),
          title: newMemory.title,
          summary: newMemory.summary,
          transcript: newMemory.transcript,
          tasks: newMemory.tasks,
          dates: newMemory.dates,
          importantDates: newMemory.importantDates,
          people: newMemory.people,
          topics: newMemory.topics,
          audioFileName: newMemory.audioFileName,
          audioDuration: newMemory.audioDuration,
          createdAt: newMemory.createdAt,
          updatedAt: newMemory.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to save memory to database";
    console.error("[POST /api/memories Error]:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
