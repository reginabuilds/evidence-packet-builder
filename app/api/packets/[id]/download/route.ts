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
    const { data: packet, error } = await admin.from("evidence_packets").select("id, authorization_id, packet_version, packet_json").eq("id", id).eq("applicant_id", user.id).single();
    if (error || !packet) throw new Error("Evidence Packet was not found for this applicant.");
    const { data: authorization, error: authorizationError } = await admin.from("packet_authorizations").select("revoked_at").eq("id", packet.authorization_id).eq("applicant_id", user.id).single();
    if (authorizationError || !authorization || authorization.revoked_at) throw new Error("Authorization has been revoked; new packet downloads are blocked.");
    const { error: auditError } = await admin.from("packet_authorization_events").insert({ authorization_id: packet.authorization_id, applicant_id: user.id, packet_id: packet.id, event_type: "downloaded", details_json: { packet_version: packet.packet_version } });
    if (auditError) throw new Error("Download audit event could not be recorded.");
    return new NextResponse(JSON.stringify(packet.packet_json, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="evidence-packet-v${packet.packet_version}.json"` } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download Evidence Packet.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("applicant") ? 403 : message.includes("revoked") ? 409 : message.includes("Too many") ? 429 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
