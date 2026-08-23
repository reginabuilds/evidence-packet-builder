import { NextResponse } from "next/server";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireReviewer } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const admin = createSupabaseAdminClient();
    await requireReviewer(admin, user.id);
    const { data: assignments, error: assignmentError } = await admin.from("case_reviewer_assignments").select("case_id").eq("reviewer_id", user.id);
    if (assignmentError) throw new Error("Unable to load reviewer assignments.");
    const caseIds = (assignments ?? []).map((assignment) => assignment.case_id);
    if (!caseIds.length) return NextResponse.json({ items: [] });
    const { data, error } = await admin
      .from("review_items")
      .select("id, evidence_id, case_id, reason_code, details_json, state, created_at, evidence_items(title, category, verification_status, original_filename, document_date)")
      .eq("assigned_reviewer_id", user.id)
      .in("case_id", caseIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Unable to load the assigned review queue.");
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load review queue.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("human reviewer") ? 403 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
