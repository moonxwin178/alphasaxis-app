// Shared helpers for the app's API routes/server actions. Rate limiting here
// is best-effort in-memory only — it resets on cold start and doesn't
// coordinate across serverless instances, so treat it as a burst guard,
// not a real defense against a determined attacker.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getClientIp(request: Request): string {
  return getClientIpFromHeaders(request.headers);
}

/** Same as getClientIp, for Server Actions where only next/headers() is available. */
export function getClientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

const buckets = new Map<string, number[]>();

export function isRateLimited(
  bucketName: string,
  key: string,
  windowMs: number,
  maxRequests: number
): boolean {
  const now = Date.now();
  const mapKey = `${bucketName}:${key}`;
  const timestamps = (buckets.get(mapKey) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  buckets.set(mapKey, timestamps);
  // Prevent unbounded growth across many distinct keys.
  if (buckets.size > 10000) buckets.clear();
  return timestamps.length > maxRequests;
}

export function stripControlChars(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
