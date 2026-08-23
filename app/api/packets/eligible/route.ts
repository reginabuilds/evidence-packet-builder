import { NextResponse } from "next/server";
import { packetFirewallReason } from "@/lib/evidence-packet";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";
import { requireApplicant } from "@/lib/reviewer-access";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const admin = createSupabaseAdminClient();
    await requireApplicant(admin, user.id);
    const { data: evidence, error } = await admin.from("evidence_items").select("id, case_id, title, category, document_date, verification_status, excluded_by_applicant").eq("owner_id", user.id).eq("excluded_by_applicant", false).neq("verification_status", "rejected").order("uploaded_at", { ascending: false });
    if (error) throw new Error("Unable to load eligible evidence.");
    const eligible = [];
    for (const item of evidence ?? []) {
      const [{ data: extraction }, { data: corrections }] = await Promise.all([
        admin.from("evidence_extractions").select("extracted_json").eq("evidence_id", item.id).order("version", { ascending: false }).limit(1).maybeSingle(),
        admin.from("evidence_corrections").select("field_name, corrected_value_json").eq("evidence_id", item.id),
      ]);
      if (!packetFirewallReason(item, extraction?.extracted_json, corrections)) eligible.push(item);
    }
    return NextResponse.json({ evidence: eligible });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load eligible evidence.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("applicant") ? 403 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
