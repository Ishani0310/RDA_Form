import mongoose from "mongoose";
import dns from "dns";

// Prefer IPv4 resolution order to avoid transient Windows IPv6 getaddrinfo timeouts with MongoDB Atlas
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * MongoDB Atlas Connection Utility for Next.js 15
 * Road Development Authority (RDA) Contractor Data Collection System
 * 
 * Features:
 * - Connection caching via global singleton for Next.js hot-reloading & serverless lifecycle
 * - Safe error handling preventing credential leakage
 * - Timeout guards to avoid serverless hangs
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global interface for caching
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables. Please check your .env.local file."
    );
  }

  // Return existing active connection if already established
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is disconnected or terminated, reset cached promise to allow fresh connection attempt
  if (!cached.conn || (cached.conn.connection.readyState !== 1 && cached.conn.connection.readyState !== 2)) {
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds for cloud Atlas discovery
      maxPoolSize: 10,                 // Efficient pool size for Next.js
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        // Attach disconnect listeners to invalidate cache on connection drop
        mongooseInstance.connection.on("disconnected", () => {
          cached.conn = null;
          cached.promise = null;
        });
        mongooseInstance.connection.on("close", () => {
          cached.conn = null;
          cached.promise = null;
        });
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

/**
 * Helper to inspect current connection state without throwing
 */
export function getConnectionState(): {
  readyState: number;
  status: "disconnected" | "connected" | "connecting" | "disconnecting" | "uninitialized";
} {
  const state = mongoose.connection.readyState;
  const states: Record<number, "disconnected" | "connected" | "connecting" | "disconnecting"> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    readyState: state,
    status: states[state] || "uninitialized",
  };
}
