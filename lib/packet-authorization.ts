import { packetFirewallReason } from "@/lib/evidence-packet";

export type PacketEvidenceCandidate = { id: string; case_id: string; title: string; category: string; verification_status: string; excluded_by_applicant: boolean; extraction?: unknown; corrections?: unknown };

export function validatePacketAuthorizationSelection(records: PacketEvidenceCandidate[], selectedIds: string[]) {
  if (!selectedIds.length || records.length !== selectedIds.length) throw new Error("All selected evidence must belong to this applicant.");
  const caseIds = new Set(records.map((record) => record.case_id));
  if (caseIds.size !== 1) throw new Error("Select evidence from one applicant case at a time.");
  for (const record of records) {
    if (record.excluded_by_applicant) throw new Error("Applicant-excluded evidence cannot be authorized.");
    if (record.verification_status === "rejected") throw new Error("Human-review-rejected evidence cannot be authorized.");
    const firewallReason = packetFirewallReason(record, record.extraction, record.corrections);
    if (firewallReason) throw new Error(firewallReason);
  }
  return { caseId: records[0].case_id };
}

export function requireActivePacketAuthorization<T extends { revoked_at: string | null }>(authorization: T | null): T {
  if (!authorization) throw new Error("Applicant authorization was not found.");
  if (authorization.revoked_at) throw new Error("This authorization has been revoked and cannot generate a packet.");
  return authorization;
}
