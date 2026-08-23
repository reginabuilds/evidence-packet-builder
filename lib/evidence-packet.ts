import { createHash } from "node:crypto";
import { associationFirewallReason, containsAssociationEvidenceTerm } from "@/lib/association-firewall";

function hasAssociationTerm(value: unknown): boolean {
  if (typeof value === "string") return containsAssociationEvidenceTerm(value);
  if (Array.isArray(value)) return value.some(hasAssociationTerm);
  if (value && typeof value === "object") return Object.values(value).some(hasAssociationTerm);
  return false;
}

export function packetFirewallReason(evidence: { title: string; category: string }, extraction: unknown, corrections: unknown): string | null {
  return associationFirewallReason(evidence.category)
    ?? (containsAssociationEvidenceTerm(evidence.title) ? "Association-based evidence is not accepted in this MVP." : null)
    ?? (hasAssociationTerm(extraction) || hasAssociationTerm(corrections) ? "Association-derived content cannot be included in an Evidence Packet." : null);
}

export function hashPacket(packet: unknown) {
  return createHash("sha256").update(JSON.stringify(packet)).digest("hex");
}
