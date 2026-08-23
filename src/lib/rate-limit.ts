const requests = new Map<string, number[]>();

export function rateLimit(key: string, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = requests.get(key) || [];
  const recent = timestamps.filter(t => t > windowStart);

  if (recent.length >= limit) return false;

  recent.push(now);
  requests.set(key, recent);
  return true;
}

export function rateLimitIP(ip: string, limit = 100, windowMs = 60000) {
  return rateLimit(`ip:${ip}`, limit, windowMs);
}
