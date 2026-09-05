import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Feature 10 employer read-only page", () => {
  const page = readFileSync(resolve(process.cwd(), "app/share/[token]/page.tsx"), "utf8");
  const component = readFileSync(resolve(process.cwd(), "components/EmployerEvidencePage.tsx"), "utf8");

  it("requires a valid token, active share, and approved record before rendering", () => {
    expect(page).toContain("shareTokenSchema.safeParse(token)");
    expect(page).toContain('.eq("share_token_hash", hashShareToken(token))');
    expect(page).toContain('.is("revoked_at", null)');
    expect(page).toContain('.eq("status", "approved")');
    expect(page).toContain('.eq("approval_status", "approved_by_student")');
    expect(page).toContain("publicApprovedRecord(record.record_json)");
    expect(page).toContain("notFound()");
  });

  it("renders a read-only surface without edit or mutation controls", () => {
    expect(component).toContain("Employer read-only view");
    expect(component).toContain("read-only");
    expect(component).not.toContain("<form");
    expect(component).not.toContain("onClick");
    expect(component).not.toContain("fetch(");
  });

  it("labels AI output as a proposal and avoids forbidden evaluation language", () => {
    expect(component).toContain("AI-generated / simulated proposal");
    expect(component).toContain("not verified fact");
    expect(component).not.toMatch(/score|ranking|certificate|guarantee|hiring recommendation|job matching|trajectory recommendation/i);
  });

  it("renders only the sanitized public record shape", () => {
    expect(component).not.toContain("evidenceId");
    expect(component).not.toContain("analysisId");
    expect(component).not.toContain("owner_id");
    expect(component).not.toContain("share_token");
    expect(component).not.toContain("approved_by");
  });
});
