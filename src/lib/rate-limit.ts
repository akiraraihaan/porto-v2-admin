const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
