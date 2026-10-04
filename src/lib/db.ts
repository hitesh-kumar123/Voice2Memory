import mongoose from "mongoose";
import dns from "dns";

// Fix for Windows / ISP DNS resolving mongodb+srv SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Ignore if custom dns set is restricted
}

if (typeof dns.setDefaultResultOrder === "function") {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch (e) {
    // Ignore
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/voice2memory";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB / MongoDB Atlas with resilient connection pooling.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    // Ensure public DNS resolver is set for SRV lookup
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore
    }

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        const isAtlas =
          MONGODB_URI.includes("mongodb+srv://") || MONGODB_URI.includes("mongodb.net");
        console.log(`[MongoDB] Connected successfully to ${isAtlas ? "MongoDB Atlas" : "Local MongoDB"}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("[MongoDB Connection Error]:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Returns database health and metadata.
 */
export async function getDatabaseStatus(): Promise<{
  connected: boolean;
  isAtlas: boolean;
  readyState: number;
  databaseName?: string;
  host?: string;
  error?: string;
}> {
  try {
    const mongooseInstance = await connectToDatabase();
    const conn = mongooseInstance.connection;
    const isAtlas =
      MONGODB_URI.includes("mongodb+srv://") || MONGODB_URI.includes("mongodb.net");

    return {
      connected: conn.readyState === 1,
      isAtlas,
      readyState: conn.readyState,
      databaseName: conn.name,
      host: conn.host,
    };
  } catch (err: unknown) {
    const isAtlas =
      MONGODB_URI.includes("mongodb+srv://") || MONGODB_URI.includes("mongodb.net");
    return {
      connected: false,
      isAtlas,
      readyState: 0,
      error: err instanceof Error ? err.message : "MongoDB connection failed",
    };
  }
}
