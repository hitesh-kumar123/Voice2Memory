import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMemory extends Document {
  title: string;
  summary: string;
  transcript: string;
  tasks: string[];
  completedTasks: string[];
  importantDates: string[];
  dates: string[];
  people: string[];
  topics: string[];
  audioFileName?: string;
  audioDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    title: {
      type: String,
      required: [true, "Memory title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    summary: {
      type: String,
      required: [true, "Memory summary is required"],
      trim: true,
    },
    transcript: {
      type: String,
      required: [true, "Transcript is required"],
    },
    tasks: {
      type: [String],
      default: [],
    },
    completedTasks: {
      type: [String],
      default: [],
    },
    importantDates: {
      type: [String],
      default: [],
    },
    dates: {
      type: [String],
      default: [],
    },
    people: {
      type: [String],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
    audioFileName: {
      type: String,
      trim: true,
    },
    audioDuration: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes for title, summary, transcript, topics, people
MemorySchema.index(
  {
    title: "text",
    summary: "text",
    transcript: "text",
    topics: "text",
    people: "text",
  },
  {
    weights: {
      title: 10,
      topics: 5,
      summary: 4,
      people: 3,
      transcript: 1,
    },
    name: "MemoryTextIndex",
  }
);

// Compound index for chronological timeline querying and topic filtering
MemorySchema.index({ createdAt: -1, topics: 1 });

export const MemoryModel: Model<IMemory> =
  mongoose.models.Memory || mongoose.model<IMemory>("Memory", MemorySchema);

export default MemoryModel;
