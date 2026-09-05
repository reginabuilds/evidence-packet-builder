import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("new Evidence Record share revocation", () => {
  const route = readFileSync(resolve(process.cwd(), "app/api/evidence/record/route.ts"), "utf8");

  it("revokes an active previous share when generating a new record", () => {
    expect(route).toContain('.from("evidence_record_shares")');
    expect(route).toContain('.eq("owner_id", user.id)');
    expect(route).toContain('.is("revoked_at", null)');
    expect(route).toContain('.update({ revoked_at: revokedAt })');
    expect(route).toContain('event_type: "sharing_revoked"');
    expect(route).toContain('reason: "new_evidence_record_generated"');
  });

  it("does not activate sharing for the newly generated record", () => {
    expect(route).toContain('status: "draft"');
    expect(route).toContain('approval_status: "not_yet_approved"');
    expect(route).not.toContain('evidence_record_id: saved.id');
  });
});
