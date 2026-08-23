import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireReviewer } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

const resolutionSchema = z.object({
  decision: z.enum(["verified", "rejected", "needs_applicant_clarification"]),
  resolutionNote: z.string().trim().min(1).max(2000).refine((value) => !/[<>]/.test(value), "Resolution note cannot contain markup."),
});

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const { decision, resolutionNote } = resolutionSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    await requireReviewer(admin, user.id);
    const { data: item, error: itemError } = await admin
      .from("review_items")
      .select("id, evidence_id, case_id, state, assigned_reviewer_id")
      .eq("id", id)
      .eq("assigned_reviewer_id", user.id)
      .single();
    if (itemError || !item) throw new Error("This review item is not assigned to you.");
    if (item.state === "resolved") throw new Error("This review item has already been resolved.");

    const { data: assignment } = await admin.from("case_reviewer_assignments").select("reviewer_id").eq("case_id", item.case_id).eq("reviewer_id", user.id).maybeSingle();
    if (!assignment) throw new Error("You are not assigned to this pilot case.");
    const { data: evidence, error: evidenceError } = await admin.from("evidence_items").select("verification_status").eq("id", item.evidence_id).single();
    if (evidenceError || !evidence) throw new Error("Evidence for this review item is unavailable.");

    const nextStatus = decision === "needs_applicant_clarification" ? "pending_review" : decision;
    const { error: resolutionError } = await admin.from("review_resolutions").insert({ review_item_id: item.id, reviewer_id: user.id, decision, resolution_note: resolutionNote });
    if (resolutionError) throw new Error("Resolution could not be recorded.");
    const { error: itemUpdateError } = await admin.from("review_items").update({ state: "resolved", resolved_at: new Date().toISOString() }).eq("id", item.id);
    if (itemUpdateError) throw new Error("Review state could not be updated.");
    const { error: evidenceUpdateError } = await admin.from("evidence_items").update({ verification_status: nextStatus }).eq("id", item.evidence_id);
    if (evidenceUpdateError) throw new Error("Evidence verification state could not be updated.");
    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: item.evidence_id,
      event_type: "review_resolved",
      actor_id: user.id,
      actor_role: "reviewer",
      old_value_json: { verification_status: evidence.verification_status, review_state: item.state },
      new_value_json: { verification_status: nextStatus, review_state: "resolved", decision },
      reason: resolutionNote,
    });
    if (auditError) throw new Error("Reviewer audit event could not be recorded.");

    return NextResponse.json({ decision, verificationStatus: nextStatus, reviewState: "resolved" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve review item.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("human reviewer") || message.includes("not assigned") ? 403 : message.includes("already") ? 409 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
