import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { contextSubmissionSchema } from "@/lib/evidence-context";

async function authenticate(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "applicant") return null;
  return { user, supabase };
}

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("evidence_context")
    .select("evidence_id, purpose, role, actions, outcome, created_at, updated_at")
    .eq("owner_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Unable to load context." }, { status: 500 });
  return NextResponse.json({ context: data ?? null });
}

export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = contextSubmissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Complete all context fields with the requested detail." }, { status: 400 });

  const { evidenceId, purpose, role, actions, outcome } = parsed.data;
  const { data: evidence } = await auth.supabase
    .from("evidence_items")
    .select("id, owner_id")
    .eq("id", evidenceId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();

  if (!evidence) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });

  const { data, error } = await auth.supabase
    .from("evidence_context")
    .upsert({ evidence_id: evidenceId, owner_id: auth.user.id, purpose, role, actions, outcome }, { onConflict: "evidence_id" })
    .select("evidence_id, purpose, role, actions, outcome, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: "Unable to save context." }, { status: 500 });
  return NextResponse.json({ context: data });
}
