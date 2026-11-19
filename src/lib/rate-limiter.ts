/**
 * In-Memory Sliding Window Rate Limiter
 * Road Development Authority, Sri Lanka
 * 
 * Protects public contractor intake APIs against automated abuse, denial of service,
 * and brute-force token enumeration.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean up stale IPs periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        ipRequestMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  clientIp: string,
  limit: number = 30,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const record = ipRequestMap.get(clientIp) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  ipRequestMap.set(clientIp, record);

  return {
    allowed: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}
