import { NextResponse } from "next/server";
import { safeObjectFileName, validateEvidenceIntake, EVIDENCE_BUCKET } from "@/lib/evidence-intake";
import { getAuthenticatedUser, createSupabaseAdminClient } from "@/lib/supabase/server";
import { enforceEvidenceIntakeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    enforceEvidenceIntakeRateLimit(user.id);
    const input = validateEvidenceIntake(await request.json());
    const objectName = `${crypto.randomUUID()}-${safeObjectFileName(input.fileName)}`;
    const storagePath = `${user.id}/${objectName}`;
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(EVIDENCE_BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) throw new Error("Unable to prepare private evidence upload.");

    return NextResponse.json({ storagePath, token: data.token, signedUrl: data.signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare evidence upload.";
    const status = message.includes("Authentication") || message.includes("session") ? 401 : message.includes("Too many") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
