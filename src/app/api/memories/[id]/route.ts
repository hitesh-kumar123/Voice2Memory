import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import MemoryModel from "@/models/Memory";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid memory ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const memory = await MemoryModel.findById(id).lean();

    if (!memory) {
      return NextResponse.json(
        { success: false, error: "Memory not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      memory: {
        _id: memory._id.toString(),
        title: memory.title,
        summary: memory.summary,
        transcript: memory.transcript,
        tasks: memory.tasks || [],
        dates: memory.dates || memory.importantDates || [],
        importantDates: memory.importantDates || memory.dates || [],
        people: memory.people || [],
        topics: memory.topics || [],
        audioFileName: memory.audioFileName,
        audioDuration: memory.audioDuration,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database fetch failed";
    console.error("[GET /api/memories/[id] Error]:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid memory ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deleted = await MemoryModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Memory not found to delete." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully.",
      deletedId: id,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database delete failed";
    console.error("[DELETE /api/memories/[id] Error]:", errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
