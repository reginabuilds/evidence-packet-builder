import { NextResponse } from "next/server";
import { exclusionSchema } from "@/lib/evidence-correction";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const { id } = await context.params;
    const { reason } = exclusionSchema.parse(await request.json());
    const admin = createSupabaseAdminClient();
    const { data: evidence, error } = await admin
      .from("evidence_items")
      .select("id, verification_status, excluded_by_applicant")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (error || !evidence) throw new Error("Evidence was not found for this applicant.");
    if (evidence.excluded_by_applicant) return NextResponse.json({ excluded: true });

    const { error: updateError } = await admin.from("evidence_items").update({ excluded_by_applicant: true }).eq("id", evidence.id);
    if (updateError) throw new Error("Evidence could not be excluded.");
    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: evidence.id,
      event_type: "excluded",
      actor_id: user.id,
      actor_role: "applicant",
      old_value_json: { excluded_by_applicant: false },
      new_value_json: { excluded_by_applicant: true },
      reason,
    });
    if (auditError) throw new Error("Exclusion audit event could not be recorded.");
    return NextResponse.json({ excluded: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to exclude evidence.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
