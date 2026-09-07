import { NextResponse } from "next/server";
import { approveEvidenceRecord, evidenceRecordSchema } from "@/lib/evidence-record";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
async function authenticateApplicant(request: Request) { const user = await getAuthenticatedUser(request); const admin = createSupabaseAdminClient(); const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle(); if (profile?.role !== "applicant") throw new Error("Unauthorized applicant session."); return { user, admin }; }

export async function POST(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const body = await request.json().catch(() => ({}));
    if (body?.confirmApproval !== true) throw new Error("Explicit student approval is required.");
    const { data: current, error: loadError } = await admin.from("evidence_records").select("id, evidence_id, record_version, status, approval_status, record_json, created_at").eq("owner_id", user.id).eq("status", "pending_review").eq("approval_status", "not_yet_approved").order("record_version", { ascending: false }).limit(1).maybeSingle();
    if (loadError || !current) throw new Error("No pending Evidence Record is available for approval.");
    const parsed = evidenceRecordSchema.parse(current.record_json);
    if (parsed.reviewSummary.reviewedProposals !== parsed.reviewSummary.totalProposals) throw new Error("All AI proposals must be reviewed before approval.");
    const approvedRecord = approveEvidenceRecord(parsed);
    const { data: saved, error: saveError } = await admin.from("evidence_records").update({ status: "approved", approval_status: "approved_by_student", record_json: approvedRecord, approved_at: approvedRecord.studentApprovedInformation.approvedAt, approved_by: user.id }).eq("id", current.id).eq("owner_id", user.id).eq("status", "pending_review").eq("approval_status", "not_yet_approved").select("id, evidence_id, record_version, status, approval_status, record_json, created_at, approved_at, approved_by").single();
    if (saveError) throw new Error("Evidence Record could not be approved.");
    const { error: auditError } = await admin.from("transformation_events").insert({ evidence_id: saved.evidence_id, event_type: "review_resolved", actor_id: user.id, actor_role: "applicant", new_value_json: { record_id: saved.id, record_version: saved.record_version, approval_status: "approved_by_student" }, reason: "Student explicitly approved the finalized Evidence Record. AI-generated or simulated content remains a labeled proposal." });
    if (auditError) throw new Error("Approval audit event could not be recorded.");
    return NextResponse.json({ record: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve the Evidence Record.";
    const status = message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
