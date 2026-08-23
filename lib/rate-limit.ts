const windowMs = 10 * 60 * 1000;
const maximumRequests = 20;
const attempts = new Map<string, number[]>();

/**
 * Deliberately small demo safeguard for signed-upload endpoints. A production deployment
 * should replace this process-local limit with a shared store such as Upstash or Supabase.
 */
export function enforceEvidenceIntakeRateLimit(userId: string) {
  const now = Date.now();
  const recent = (attempts.get(userId) ?? []).filter((time) => time > now - windowMs);
  if (recent.length >= maximumRequests) throw new Error("Too many evidence-intake requests. Try again in a few minutes.");
  recent.push(now);
  attempts.set(userId, recent);
}
