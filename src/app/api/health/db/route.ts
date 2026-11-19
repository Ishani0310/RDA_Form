import { NextResponse } from "next/server";
import { connectToDatabase, getConnectionState } from "@/lib/mongodb";

/**
 * Safe Database Health Check API Endpoint
 * GET /api/health/db
 *
 * Security:
 * - Never returns connection strings, credentials, or usernames
 * - Only reveals connection status, latency, and sanitized host name
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      {
        service: "RDA Contractor Data Collection System",
        environment: process.env.NODE_ENV || "development",
        database: {
          configured: false,
          status: "unconfigured",
          message: "MONGODB_URI is not configured in environment variables (.env.local).",
          readyState: 0,
        },
        timestamp,
      },
      { status: 200 }
    );
  }

  try {
    const mongooseInstance = await connectToDatabase();
    const durationMs = Date.now() - startTime;
    const { status, readyState } = getConnectionState();

    // Safely extract database name without credentials
    const dbName = mongooseInstance.connection.name || "default";
    const host = mongooseInstance.connection.host || "connected-cluster";

    return NextResponse.json(
      {
        service: "RDA Contractor Data Collection System",
        environment: process.env.NODE_ENV || "development",
        database: {
          configured: true,
          status,
          readyState,
          databaseName: dbName,
          clusterHost: host,
          latencyMs: durationMs,
        },
        timestamp,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database connection failure";

    // Redact credentials and sensitive network parameters
    const sanitizedMessage = errorMessage
      .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb$1://[REDACTED]@")
      .replace(/:[0-9]{4,5}/g, ":[PORT]");

    const safeDisplayError =
      process.env.NODE_ENV === "production"
        ? "Database connection unavailable. Please check cluster health and network access."
        : sanitizedMessage;

    return NextResponse.json(
      {
        service: "RDA Contractor Data Collection System",
        environment: process.env.NODE_ENV || "development",
        database: {
          configured: true,
          status: "error",
          readyState: 0,
          error: safeDisplayError,
        },
        timestamp,
      },
      { status: 503 }
    );
  }
}
