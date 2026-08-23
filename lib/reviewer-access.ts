import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireReviewer(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (error || data?.role !== "reviewer") throw new Error("A signed-in human reviewer is required.");
}

export async function requireApplicant(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (error || data?.role !== "applicant") throw new Error("A signed-in applicant is required.");
}

export async function assignedReviewerId(admin: SupabaseClient, caseId: string) {
  const { data, error } = await admin
    .from("case_reviewer_assignments")
    .select("reviewer_id")
    .eq("case_id", caseId)
    .order("assigned_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data?.reviewer_id) throw new Error("No human reviewer is assigned to this pilot case.");
  return data.reviewer_id;
}
