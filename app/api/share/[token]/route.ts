import { NextResponse } from "next/server";
import { hashShareToken, publicApprovedRecord, shareTokenSchema } from "@/lib/evidence-sharing";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    if (!shareTokenSchema.safeParse(token).success) return NextResponse.json({ error: "Shared Evidence Record not found." }, { status: 404 });

    const admin = createSupabaseAdminClient();
    const { data: share, error: shareError } = await admin.from("evidence_record_shares")
      .select("evidence_record_id")
      .eq("share_token_hash", hashShareToken(token))
      .is("revoked_at", null)
      .maybeSingle();
    if (shareError || !share) return NextResponse.json({ error: "This shared Evidence Record is no longer available." }, { status: 404 });

    const { data: record, error: recordError } = await admin.from("evidence_records")
      .select("record_json")
      .eq("id", share.evidence_record_id)
      .eq("status", "approved")
      .eq("approval_status", "approved_by_student")
      .maybeSingle();
    if (recordError || !record) return NextResponse.json({ error: "This shared Evidence Record is no longer available." }, { status: 404 });

    return NextResponse.json({ record: publicApprovedRecord(record.record_json) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "This shared Evidence Record is no longer available." }, { status: 404 });
  }
}
