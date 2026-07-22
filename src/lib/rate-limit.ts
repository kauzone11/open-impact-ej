import { HubApiError } from "@/lib/hub/api";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function requestClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export function enforceRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) throw new HubApiError("Muitas tentativas. Aguarde e tente novamente.", 429);
  current.count += 1;
  if (buckets.size > 10_000) for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
}
