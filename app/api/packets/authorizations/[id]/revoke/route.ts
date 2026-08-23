import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireApplicant } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

const revokeSchema = z.object({ reason: z.string().trim().min(1).max(2000).refine((value) => !/[<>]/.test(value), "Revocation reason cannot contain markup.") });
export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const { reason } = revokeSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    await requireApplicant(admin, user.id);
    const { data: authorization, error } = await admin.from("packet_authorizations").select("id, revoked_at").eq("id", id).eq("applicant_id", user.id).single();
    if (error || !authorization) throw new Error("Applicant authorization was not found.");
    if (authorization.revoked_at) return NextResponse.json({ revokedAt: authorization.revoked_at });
    const revokedAt = new Date().toISOString();
    const { error: updateError } = await admin.from("packet_authorizations").update({ revoked_at: revokedAt }).eq("id", authorization.id);
    if (updateError) throw new Error("Authorization revocation could not be recorded.");
    const { error: auditError } = await admin.from("packet_authorization_events").insert({ authorization_id: authorization.id, applicant_id: user.id, event_type: "revoked", details_json: { reason } });
    if (auditError) throw new Error("Revocation audit event could not be recorded.");
    return NextResponse.json({ revokedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke authorization.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("applicant") ? 403 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
