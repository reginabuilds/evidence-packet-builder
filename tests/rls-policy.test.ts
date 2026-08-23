import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/20260822000100_create_evidence_schema.sql", import.meta.url), "utf8");

describe("RLS policy coverage", () => {
  it("enables RLS and scopes applicant evidence reads to the authenticated owner", () => {
    expect(migration).toContain("alter table public.evidence_items enable row level security");
    expect(migration).toContain('create policy "evidence: applicant reads own"');
    expect(migration).toContain("using (owner_id = auth.uid())");
  });
  it("does not grant applicants a direct verification update policy", () => {
    expect(migration).not.toContain('create policy "evidence: applicant verifies evidence"');
    expect(readFileSync(new URL("../supabase/migrations/20260822000300_add_applicant_corrections.sql", import.meta.url), "utf8")).toContain('drop policy if exists "evidence: applicant updates own non-provenance fields"');
  });
});
