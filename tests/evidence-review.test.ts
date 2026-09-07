import { describe, expect, it } from "vitest";
import fs from "node:fs";

const route = fs.readFileSync("app/api/evidence/review/route.ts", "utf8");
const panel = fs.readFileSync("components/StudentReviewPanel.tsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260905001000_add_evidence_ai_proposal_reviews.sql", "utf8");
const analysis = fs.readFileSync("lib/evidence-analysis.ts", "utf8");
const intake = fs.readFileSync("app/api/evidence/intake/finalize/route.ts", "utf8");
const context = fs.readFileSync("app/api/evidence/context/route.ts", "utf8");

const forbidden = /verified skill|certified|guaranteed capability|AI approved|Employer approved/i;

describe("Feature 07 — student review and approval", () => {
  it("authenticated owner can view their AI proposal", () => {
    expect(route).toContain("getAuthenticatedUser(request)");
    expect(route).toContain("eq(\"owner_id\", user.id)");
    expect(route).toContain("select(\"id, evidence_id, analysis_json");
  });

  it("authenticated owner can accept their own proposal", () => {
    expect(route).toContain('decision === "accepted"');
    expect(route).toContain("decision");
    expect(route).toContain("student_id: user.id");
  });

  it("authenticated owner can reject their own proposal", () => {
    expect(route).toContain('decision === "rejected"');
    expect(panel).toContain('decide(index, "rejected")');
    expect(panel).toContain("Reject proposal");
  });

  it("unauthenticated users cannot approve or reject", () => {
    expect(route).toContain("getAuthenticatedUser(request)");
    expect(route).toContain("Unauthorized applicant session.");
  });

  it("student cannot approve or reject another student's proposal", () => {
    expect(route).toContain("eq(\"owner_id\", user.id)");
    expect(route).toContain("eq(\"owner_id\", user.id)\n      .maybeSingle()");
    expect(migration).toContain("student_id = auth.uid()");
    expect(migration).toContain("a.owner_id = auth.uid()");
    expect(migration).toContain("e.owner_id = auth.uid()");
  });

  it("AI analysis alone does not create approval", () => {
    expect(analysis).not.toContain("evidence_ai_proposal_reviews");
    expect(route).toContain("evidence_ai_analyses");
    expect(route).toContain("POST");
    expect(route).toContain("review_resolved");
  });

  it("accepted proposal is stored as accepted", () => {
    expect(migration).toContain("check (decision in ('accepted', 'rejected'))");
    expect(panel).toContain("Accepted by student");
  });

  it("rejected proposal is stored as rejected", () => {
    expect(migration).toContain("'rejected'");
    expect(panel).toContain("Rejected by student");
  });

  it("duplicate or inconsistent decisions are prevented", () => {
    expect(migration).toContain("unique (analysis_id, proposal_index)");
    expect(route).toContain("already has that student decision");
    expect(route).toContain("status: 409");
    expect(route).toContain("if (existing)");
  });

  it("approval is attributable to the authenticated student", () => {
    expect(route).toContain("student_id: user.id");
    expect(route).toContain("student_id: user.id,");
    expect(route).toContain("student_id: user.id");
    expect(migration).toContain("student_id uuid not null references auth.users(id)");
  });

  it("original AI analysis remains unchanged", () => {
    expect(route).not.toContain("update({ analysis_json");
    expect(route).toContain("from(\"evidence_ai_analyses\")");
    expect(route).toContain("analysis_json");
  });

  it("original artifact remains unchanged", () => {
    expect(route).not.toContain("from(\"evidence_items\").update");
    expect(route).not.toContain("storage.from");
    expect(intake).toContain("evidence_items");
  });

  it("audit event is recorded for the student decision", () => {
    expect(route).toContain('event_type: "review_resolved"');
    expect(route).toContain("proposal_id: id");
    expect(route).toContain("decision,");
    expect(route).toContain("student_id: user.id");
  });

  it("existing Features 01–06 remain outside the Feature 07 mutation path", () => {
    expect(route).not.toContain("evidence_records");
    expect(route).not.toContain("evidence_record_sharing");
    expect(route).not.toContain("share_token");
    expect(route).not.toContain("employer");
    expect(context).toContain("evidence_context");
    expect(analysis).toContain("aiAnalysisSchema");
  });

  it("review UI clearly separates AI proposal from student decision and avoids forbidden claims", () => {
    expect(panel).toContain("AI proposal");
    expect(panel).toContain("Student decision");
    expect(panel).toContain("Accept proposal");
    expect(panel).toContain("Reject proposal");
    expect(panel).not.toMatch(forbidden);
  });
});
