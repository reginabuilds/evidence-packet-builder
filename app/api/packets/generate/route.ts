import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPacket, packetFirewallReason } from "@/lib/evidence-packet";
import { PACKET_DISCLOSURE } from "@/lib/product-limits";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireApplicant } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

const generateSchema = z.object({ authorizationId: z.string().uuid() });
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { authorizationId } = generateSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    await requireApplicant(admin, user.id);
    const { data: authorization, error: authorizationError } = await admin.from("packet_authorizations").select("id, case_id, applicant_id, authorized_at, revoked_at, selected_evidence_ids_json").eq("id", authorizationId).eq("applicant_id", user.id).single();
    if (authorizationError || !authorization) throw new Error("Applicant authorization was not found.");
    if (authorization.revoked_at) throw new Error("This authorization has been revoked and cannot generate a packet.");
    const evidenceIds = authorization.selected_evidence_ids_json;
    if (!Array.isArray(evidenceIds) || !evidenceIds.every((id) => typeof id === "string")) throw new Error("Authorization contains invalid evidence selection.");
    const { data: evidenceRecords, error: evidenceError } = await admin.from("evidence_items").select("id, case_id, title, category, source_type, original_filename, document_date, uploaded_at, verification_status, excluded_by_applicant").eq("owner_id", user.id).eq("case_id", authorization.case_id).in("id", evidenceIds);
    if (evidenceError || !evidenceRecords || evidenceRecords.length !== evidenceIds.length) throw new Error("Authorized evidence is unavailable.");

    const packetEvidence = [];
    for (const evidence of evidenceRecords.sort((a, b) => evidenceIds.indexOf(a.id) - evidenceIds.indexOf(b.id))) {
      if (evidence.excluded_by_applicant) throw new Error("Applicant-excluded evidence cannot be included in a packet.");
      if (evidence.verification_status === "rejected") throw new Error("Human-review-rejected evidence cannot be included in a packet.");
      const [provenanceResult, extractionResult, correctionResult, reviewResult, eventResult] = await Promise.all([
        admin.from("provenance_records").select("source_type, source_name, original_filename, file_hash, uploaded_at, declared_document_date").eq("evidence_id", evidence.id).single(),
        admin.from("evidence_extractions").select("version, extracted_json, confidence_json, extractor_name, extraction_status, created_at").eq("evidence_id", evidence.id).order("version", { ascending: false }).limit(1).maybeSingle(),
        admin.from("evidence_corrections").select("field_name, original_value_json, corrected_value_json, correction_reason, created_at").eq("evidence_id", evidence.id).order("created_at", { ascending: true }),
        admin.from("review_items").select("id, reason_code, state, created_at, resolved_at").eq("evidence_id", evidence.id).order("created_at", { ascending: true }),
        admin.from("transformation_events").select("event_type, actor_role, old_value_json, new_value_json, reason, created_at").eq("evidence_id", evidence.id).order("created_at", { ascending: true }),
      ]);
      const firewallReason = packetFirewallReason(evidence, extractionResult.data?.extracted_json, correctionResult.data);
      if (firewallReason) {
        await admin.from("association_firewall_events").insert({ owner_id: user.id, actor_id: user.id, evidence_id: evidence.id, attempted_category: evidence.category, reason: firewallReason });
        throw new Error(firewallReason);
      }
      const reviewIds = (reviewResult.data ?? []).map((review) => review.id);
      const { data: resolutions } = reviewIds.length ? await admin.from("review_resolutions").select("review_item_id, decision, resolution_note, created_at").in("review_item_id", reviewIds) : { data: [] as Array<{ review_item_id: string; decision: string; resolution_note: string; created_at: string }> };
      packetEvidence.push({
        evidence_id: evidence.id,
        title: evidence.title,
        category: evidence.category,
        source: provenanceResult.data ?? null,
        document_date: evidence.document_date,
        verification_status: evidence.verification_status,
        structured_extraction: extractionResult.data ?? null,
        corrections: correctionResult.data ?? [],
        review_state: (reviewResult.data ?? []).map((review) => ({ ...review, resolution: (resolutions ?? []).find((resolution) => resolution.review_item_id === review.id) ?? null })),
        transformation_history: eventResult.data ?? [],
      });
    }

    const { data: latestPacket } = await admin.from("evidence_packets").select("packet_version").eq("case_id", authorization.case_id).order("packet_version", { ascending: false }).limit(1).maybeSingle();
    const packetVersion = (latestPacket?.packet_version ?? 0) + 1;
    const generatedAt = new Date().toISOString();
    const packet = {
      packet_type: "Evidence Packet",
      packet_version: packetVersion,
      generated_at: generatedAt,
      authorization: { authorization_id: authorization.id, authorized_at: authorization.authorized_at, selected_evidence_ids: evidenceIds },
      disclosure: PACKET_DISCLOSURE,
      evidence: packetEvidence,
    };
    const packetHash = hashPacket(packet);
    const { data: storedPacket, error: insertError } = await admin.from("evidence_packets").insert({ case_id: authorization.case_id, applicant_id: user.id, authorization_id: authorization.id, packet_version: packetVersion, packet_json: packet, packet_hash: packetHash, generated_at: generatedAt, release_status: "authorized" }).select("id, packet_version, generated_at, packet_hash, release_status").single();
    if (insertError || !storedPacket) throw new Error("Immutable Evidence Packet snapshot could not be created.");
    const { error: auditError } = await admin.from("packet_authorization_events").insert({ authorization_id: authorization.id, applicant_id: user.id, packet_id: storedPacket.id, event_type: "packet_generated", details_json: { packet_version: packetVersion, packet_hash: packetHash, selected_evidence_ids: evidenceIds } });
    if (auditError) throw new Error("Packet-generation audit event could not be recorded.");
    return NextResponse.json({ packet: storedPacket }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate Evidence Packet.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("applicant") ? 403 : message.includes("revoked") ? 409 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
