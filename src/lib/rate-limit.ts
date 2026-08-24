// Simple in-memory sliding-window rate limiter.
//
// NOTE: This is per-process memory. In a multi-instance/serverless deployment
// it should be backed by a shared store (Redis, Upstash, etc.). It also now
// evicts expired buckets so the Map cannot grow unbounded over time.

const requests = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number) {
  // Sweep at most once every ~5 minutes.
  if (now - lastSweep < 5 * 60 * 1000) return;
  lastSweep = now;
  for (const [key, timestamps] of requests) {
    // Drop keys that have no recent timestamps at all (oldest < 1h).
    const cutoff = now - 60 * 60 * 1000;
    if (timestamps.length === 0 || timestamps[timestamps.length - 1] < cutoff) {
      requests.delete(key);
    }
  }
}

export function rateLimit(key: string, limit = 30, windowMs = 60000) {
  const now = Date.now();
  sweep(now);

  const windowStart = now - windowMs;
  const timestamps = requests.get(key) || [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) return false;

  recent.push(now);
  requests.set(key, recent);
  return true;
}

export function rateLimitIP(ip: string, limit = 100, windowMs = 60000) {
  return rateLimit(`ip:${ip}`, limit, windowMs);
}

/**
 * Best-effort extraction of the client IP from request headers.
 * Falls back to "unknown" when no identifying header is present.
 */
export function getClientIP(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
