import { describe, expect, it } from "vitest";
import { validatePacketAuthorizationSelection, requireActivePacketAuthorization } from "@/lib/packet-authorization";

const candidate = { id: "e1", case_id: "case-1", title: "Demo receipt", category: "sales_receipt", verification_status: "pending_review", excluded_by_applicant: false, extraction: { statedActivity: "Demo sale" }, corrections: [] };

describe("packet eligibility and authorization", () => {
  it("accepts eligible evidence only after explicit authorization exists", () => {
    expect(validatePacketAuthorizationSelection([candidate], ["e1"])).toEqual({ caseId: "case-1" });
    expect(() => requireActivePacketAuthorization(null)).toThrow("authorization was not found");
    expect(requireActivePacketAuthorization({ revoked_at: null })).toEqual({ revoked_at: null });
  });
  it("rejects blocked association evidence and revoked authorization", () => {
    expect(() => validatePacketAuthorizationSelection([{ ...candidate, title: "Community referral record" }], ["e1"])).toThrow("Association");
    expect(() => requireActivePacketAuthorization({ revoked_at: "2026-08-22T10:00:00Z" })).toThrow("revoked");
  });
});
