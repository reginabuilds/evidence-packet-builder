import { notFound } from "next/navigation";
import { hashShareToken, publicApprovedRecord, shareTokenSchema } from "@/lib/evidence-sharing";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import EmployerEvidencePage from "@/components/EmployerEvidencePage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SharedEvidenceRecordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!shareTokenSchema.safeParse(token).success) notFound();

  const admin = createSupabaseAdminClient();
  const { data: share, error: shareError } = await admin
    .from("evidence_record_shares")
    .select("evidence_record_id")
    .eq("share_token_hash", hashShareToken(token))
    .is("revoked_at", null)
    .maybeSingle();

  if (shareError || !share) notFound();

  const { data: record, error: recordError } = await admin
    .from("evidence_records")
    .select("record_json")
    .eq("id", share.evidence_record_id)
    .eq("status", "approved")
    .eq("approval_status", "approved_by_student")
    .maybeSingle();

  if (recordError || !record) notFound();

  let publicRecord;
  try {
    publicRecord = publicApprovedRecord(record.record_json);
  } catch {
    notFound();
  }

  return <EmployerEvidencePage record={publicRecord} />;
}
