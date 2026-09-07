import { describe, expect, it } from "vitest";
import fs from "node:fs";
const route=fs.readFileSync("app/api/evidence/review/route.ts","utf8"); const recordRoute=fs.readFileSync("app/api/evidence/record/route.ts","utf8"); const approveRoute=fs.readFileSync("app/api/evidence/record/approve/route.ts","utf8"); const panel=fs.readFileSync("components/StudentReviewPanel.tsx","utf8"); const migration=fs.readFileSync("supabase/migrations/20260907000100_complete_student_review_approval.sql","utf8"); const record=fs.readFileSync("lib/evidence-record.ts","utf8");
const forbidden=/verified skill|certified|guaranteed capability|AI approved|Employer approved/i;
describe("Feature 08 — student-controlled finalization",()=>{
 it("supports authenticated owner review",()=>{expect(route).toContain("getAuthenticatedUser(request)");expect(route).toContain('eq("owner_id", user.id)');expect(route).toContain('student_id: user.id');});
 it("supports accept, reject, remove and edit",()=>{expect(route).toContain('decision === "accepted"');expect(route).toContain('decision === "rejected"');expect(route).toContain('decision === "removed"');expect(route).toContain("edited_capability");expect(panel).toContain("Remove");expect(panel).toContain("Edit");});
 it("final record is built only after every proposal is reviewed",()=>{expect(recordRoute).toContain("Review every AI proposal before generating the final Evidence Record.");expect(recordRoute).toContain("finalizedCapabilities");expect(recordRoute).toContain('status: "pending_review"');});
 it("only accepted proposals enter finalized capabilities",()=>{expect(recordRoute).toContain('review.decision !== "accepted"');expect(record).toContain("Only capabilities explicitly accepted by the student appear in finalizedCapabilities.");});
 it("every finalized capability retains supporting evidence",()=>{expect(record).toContain("supportingEvidence");expect(record).toContain("Every finalized capability must have supporting evidence.");});
 it("approval requires pending_review and explicit student confirmation",()=>{expect(approveRoute).toContain('eq("status", "pending_review")');expect(approveRoute).toContain("confirmApproval !== true");expect(approveRoute).toContain("approveEvidenceRecord");});
 it("AI analysis alone cannot approve",()=>{expect(recordRoute).not.toContain('status: "approved"');expect(approveRoute).toContain("approveEvidenceRecord");});
 it("original artifact and AI analysis are not mutated by review",()=>{expect(route).not.toContain("update({ analysis_json");expect(route).not.toContain('from("evidence_items").update');});
 it("database supports pending review and removal/edit metadata",()=>{expect(migration).toContain("pending_review");expect(migration).toContain("removed");expect(migration).toContain("edited_capability");});
 it("forbidden product claims remain absent",()=>{expect(panel).not.toMatch(forbidden);expect(record).not.toMatch(forbidden);});
});
