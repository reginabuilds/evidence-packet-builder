import { NextResponse } from "next/server";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireApplicant } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const admin = createSupabaseAdminClient();
    await requireApplicant(admin, user.id);
    const { data: packet, error } = await admin.from("evidence_packets").select("id, authorization_id, packet_version, packet_json, packet_hash, generated_at, release_status").eq("id", id).eq("applicant_id", user.id).single();
    if (error || !packet) throw new Error("Evidence Packet was not found for this applicant.");
    const { data: authorization } = await admin.from("packet_authorizations").select("authorized_at, revoked_at").eq("id", packet.authorization_id).eq("applicant_id", user.id).single();
    return NextResponse.json({ packet, authorization });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Evidence Packet.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("applicant") ? 403 : message.includes("Too many") ? 429 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
