type Bucket = { count: number; expiresAt: number };

const buckets = new Map<string, Bucket>();

export function getClientKey(req: Request, extra: string = "") {
  // Try to identify client by IP; fall back to user-agent
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")?.trim()
    || "unknown";
  const ua = req.headers.get("user-agent") || "";
  return `${ip}|${ua}|${extra}`;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetIn: windowMs } as const;
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetIn: bucket.expiresAt - now } as const;
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetIn: bucket.expiresAt - now } as const;
}
