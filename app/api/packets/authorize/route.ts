import { NextResponse } from "next/server";
import { z } from "zod";
import { packetFirewallReason } from "@/lib/evidence-packet";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireApplicant } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

const authorizationSchema = z.object({ evidenceIds: z.array(z.string().uuid()).min(1).max(50).refine((ids) => new Set(ids).size === ids.length, "Evidence may be selected only once."), releaseConfirmed: z.literal(true) });
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { evidenceIds } = authorizationSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    await requireApplicant(admin, user.id);
    const { data: records, error } = await admin.from("evidence_items").select("id, case_id, title, category, verification_status, excluded_by_applicant").eq("owner_id", user.id).in("id", evidenceIds);
    if (error || !records || records.length !== evidenceIds.length) throw new Error("All selected evidence must belong to this applicant.");
    const caseIds = new Set(records.map((record) => record.case_id));
    if (caseIds.size !== 1) throw new Error("Select evidence from one applicant case at a time.");
    for (const record of records) {
      if (record.excluded_by_applicant) throw new Error("Applicant-excluded evidence cannot be authorized.");
      if (record.verification_status === "rejected") throw new Error("Human-review-rejected evidence cannot be authorized.");
      const [{ data: extraction }, { data: corrections }] = await Promise.all([
        admin.from("evidence_extractions").select("extracted_json").eq("evidence_id", record.id).order("version", { ascending: false }).limit(1).maybeSingle(),
        admin.from("evidence_corrections").select("field_name, corrected_value_json").eq("evidence_id", record.id),
      ]);
      const firewallReason = packetFirewallReason(record, extraction?.extracted_json, corrections);
      if (firewallReason) {
        await admin.from("association_firewall_events").insert({ owner_id: user.id, actor_id: user.id, evidence_id: record.id, attempted_category: record.category, reason: firewallReason });
        throw new Error(firewallReason);
      }
    }
    const caseId = records[0].case_id;
    const { data: authorization, error: authorizationError } = await admin.from("packet_authorizations").insert({ case_id: caseId, applicant_id: user.id, selected_evidence_ids_json: evidenceIds }).select("id, authorized_at").single();
    if (authorizationError || !authorization) throw new Error("Applicant authorization could not be recorded.");
    const { error: auditError } = await admin.from("packet_authorization_events").insert({ authorization_id: authorization.id, applicant_id: user.id, event_type: "authorized", details_json: { selected_evidence_ids: evidenceIds } });
    if (auditError) throw new Error("Authorization audit event could not be recorded.");
    return NextResponse.json({ authorization }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to authorize Evidence Packet generation.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("applicant") ? 403 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
