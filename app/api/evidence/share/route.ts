import { NextResponse } from "next/server";
import { createShareToken, hashShareToken, publicApprovedRecord, shareTokenSchema } from "@/lib/evidence-sharing";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function authenticateApplicant(request: Request) {
  const user = await getAuthenticatedUser(request);
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "applicant") throw new Error("Unauthorized applicant session.");
  return { user, admin };
}

async function activeShare(admin: ReturnType<typeof createSupabaseAdminClient>, ownerId: string) {
  const { data, error } = await admin.from("evidence_record_shares")
    .select("id, evidence_record_id, created_at, revoked_at")
    .eq("owner_id", ownerId).is("revoked_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("Unable to load sharing status.");
  return data ?? null;
}

export async function GET(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const share = await activeShare(admin, user.id);
    if (!share) return NextResponse.json({ sharingActive: false, shareUrl: null });
    const { data: row } = await admin.from("evidence_record_shares").select("share_token").eq("id", share.id).eq("owner_id", user.id).single();
    const token = row?.share_token;
    if (!token || !shareTokenSchema.safeParse(token).success) throw new Error("Sharing token is unavailable.");
    return NextResponse.json({ sharingActive: true, shareUrl: `${new URL(request.url).origin}/api/share/${token}`, createdAt: share.created_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load sharing status.";
    return NextResponse.json({ error: message }, { status: message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : 400 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const { data: record, error: recordError } = await admin.from("evidence_records")
      .select("id, evidence_id, record_version, status, approval_status, record_json")
      .eq("owner_id", user.id).eq("status", "approved").eq("approval_status", "approved_by_student")
      .order("record_version", { ascending: false }).limit(1).maybeSingle();
    if (recordError || !record) throw new Error("Only an approved Evidence Record can be shared.");
    publicApprovedRecord(record.record_json);

    const existing = await activeShare(admin, user.id);
    if (existing) {
      const { data: row } = await admin.from("evidence_record_shares").select("share_token, created_at").eq("id", existing.id).single();
      if (!row?.share_token || !shareTokenSchema.safeParse(row.share_token).success) throw new Error("Sharing token is unavailable.");
      return NextResponse.json({ sharingActive: true, shareUrl: `${new URL(request.url).origin}/api/share/${row.share_token}`, createdAt: row.created_at });
    }

    const token = createShareToken();
    const { data: share, error: shareError } = await admin.from("evidence_record_shares").insert({
      evidence_record_id: record.id,
      owner_id: user.id,
      share_token: token,
      share_token_hash: hashShareToken(token),
    }).select("id, created_at").single();
    if (shareError || !share) throw new Error("Sharing could not be activated.");

    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: record.evidence_id,
      event_type: "sharing_enabled",
      actor_id: user.id,
      actor_role: "applicant",
      new_value_json: { sharing: "active", evidence_record_version: record.record_version },
      reason: "Student activated sharing for an approved Evidence Record.",
    });
    if (auditError) throw new Error("Sharing audit event could not be recorded.");

    return NextResponse.json({ sharingActive: true, shareUrl: `${new URL(request.url).origin}/api/share/${token}`, createdAt: share.created_at }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate sharing.";
    return NextResponse.json({ error: message }, { status: message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, admin } = await authenticateApplicant(request);
    const share = await activeShare(admin, user.id);
    if (!share) return NextResponse.json({ sharingActive: false });
    const revokedAt = new Date().toISOString();
    const { error } = await admin.from("evidence_record_shares").update({ revoked_at: revokedAt }).eq("id", share.id).eq("owner_id", user.id).is("revoked_at", null);
    if (error) throw new Error("Sharing could not be revoked.");
    const { error: auditError } = await admin.from("transformation_events").insert({
      evidence_id: share.evidence_record_id,
      event_type: "sharing_revoked",
      actor_id: user.id,
      actor_role: "applicant",
      new_value_json: { sharing: "revoked", revoked_at: revokedAt },
      reason: "Student revoked the active shared Evidence Record link.",
    });
    if (auditError) throw new Error("Sharing revocation audit event could not be recorded.");
    return NextResponse.json({ sharingActive: false, revokedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to revoke sharing.";
    return NextResponse.json({ error: message }, { status: message.includes("Authentication") || message.includes("Unauthorized") || message.includes("session") ? 401 : 400 });
  }
}
