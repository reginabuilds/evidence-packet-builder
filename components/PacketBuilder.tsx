"use client";

import { useEffect, useState } from "react";
import { PACKET_DISCLOSURE } from "@/lib/product-limits";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Evidence = { id: string; title: string; category: string; document_date: string | null; verification_status: string };
type PacketView = { id: string; authorization_id: string; packet_version: number; packet_hash: string; generated_at: string; packet_json: { disclosure: string; evidence: Array<{ title: string; category: string; verification_status: string; source: { source_name?: string; uploaded_at?: string } | null; corrections: unknown[]; review_state: unknown[] }> }; authorization: { authorized_at: string; revoked_at: string | null } };

export function PacketBuilder() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [authorizationId, setAuthorizationId] = useState<string>();
  const [packet, setPacket] = useState<PacketView>();
  const [message, setMessage] = useState<string | undefined>("Loading eligible evidence…");
  const [pending, setPending] = useState(false);

  async function headers() {
    const { data } = await createBrowserSupabaseClient().auth.getSession();
    if (!data.session?.access_token) throw new Error("Sign in with the fictional applicant account first.");
    return { Authorization: `Bearer ${data.session.access_token}` };
  }

  async function loadEligible() {
    try {
      const response = await fetch("/api/packets/eligible", { headers: await headers() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load eligible evidence.");
      setEvidence(result.evidence); setMessage(result.evidence.length ? "Select the evidence you authorize for this packet." : "No eligible evidence is available.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load eligible evidence."); }
  }
  useEffect(() => { void loadEligible(); }, []);

  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }

  async function authorize() {
    setPending(true); setMessage(undefined);
    try {
      const response = await fetch("/api/packets/authorize", { method: "POST", headers: { "Content-Type": "application/json", ...(await headers()) }, body: JSON.stringify({ evidenceIds: selected, releaseConfirmed: confirmed }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to record authorization.");
      setAuthorizationId(result.authorization.id); setMessage(`Authorization recorded at ${new Date(result.authorization.authorized_at).toLocaleString()}. You may now generate the immutable packet.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to record authorization."); } finally { setPending(false); }
  }

  async function generate() {
    if (!authorizationId) return;
    setPending(true); setMessage(undefined);
    try {
      const response = await fetch("/api/packets/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(await headers()) }, body: JSON.stringify({ authorizationId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to generate packet.");
      const detailResponse = await fetch(`/api/packets/${result.packet.id}`, { headers: await headers() });
      const detail = await detailResponse.json();
      if (!detailResponse.ok) throw new Error(detail.error ?? "Packet generated but preview could not load.");
      setPacket(detail); setMessage("Immutable Evidence Packet created. Review the preview below.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to generate packet."); } finally { setPending(false); }
  }

  async function revoke() {
    if (!packet) return;
    const reason = window.prompt("Why are you revoking authorization? This preserves the audit history and blocks new downloads.");
    if (!reason) return;
    setPending(true); setMessage(undefined);
    try {
      const response = await fetch(`/api/packets/authorizations/${packet.authorization_id}/revoke`, { method: "POST", headers: { "Content-Type": "application/json", ...(await headers()) }, body: JSON.stringify({ reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to revoke authorization.");
      setPacket({ ...packet, authorization: { ...packet.authorization, revoked_at: result.revokedAt } });
      setMessage("Authorization revoked. The immutable snapshot remains visible, but new downloads are blocked.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to revoke authorization."); } finally { setPending(false); }
  }

  async function download() {
    if (!packet) return;
    setPending(true); setMessage(undefined);
    try {
      const response = await fetch(`/api/packets/${packet.id}/download`, { headers: await headers() });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error ?? "Unable to download packet."); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `evidence-packet-v${packet.packet_version}.json`; link.click(); URL.revokeObjectURL(url);
      setMessage("Download recorded in authorization audit history.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to download packet."); } finally { setPending(false); }
  }

  return <div className="space-y-6"><section className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm"><p className="m-0 text-sm font-semibold text-[#657065]">Applicant-controlled release</p><h2 className="mt-1 text-xl font-bold">Select eligible evidence</h2><p className="text-sm leading-6 text-[#657065]">Applicant-excluded and Association Firewall-blocked evidence is omitted automatically. Selecting evidence does not evaluate creditworthiness.</p><div className="space-y-2">{evidence.map((item) => <label key={item.id} className="flex gap-3 rounded-lg border border-[#dfe4dc] p-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} /><span><strong>{item.title}</strong><span className="block text-xs text-[#657065]">{item.category.replaceAll("_", " ")} · {item.verification_status.replaceAll("_", " ")}</span></span></label>)}</div><label className="mt-4 flex gap-2 text-sm leading-5"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I authorize generation and release of a packet containing only my selected demo evidence.</label><p className="rounded-lg bg-[#fffaf0] p-3 text-xs leading-5 text-[#5d4b2c]">{PACKET_DISCLOSURE}</p><div className="flex flex-wrap gap-3"><button type="button" disabled={pending || !selected.length || !confirmed || Boolean(authorizationId)} onClick={() => void authorize()} className="rounded bg-[#1f5a3a] px-4 py-2 font-bold text-white disabled:opacity-60">Record authorization</button><button type="button" disabled={pending || !authorizationId} onClick={() => void generate()} className="rounded border border-[#1f5a3a] px-4 py-2 font-bold text-[#1f5a3a] disabled:opacity-60">Generate immutable packet</button></div>{message && <p role="status" className="mb-0 mt-4 text-sm leading-6 text-[#4b554c]">{message}</p>}</section>{packet && <section className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="m-0 text-sm font-semibold text-[#657065]">Readable packet preview</p><h2 className="mt-1 text-xl font-bold">Evidence Packet v{packet.packet_version}</h2><p className="text-xs text-[#657065]">Generated {new Date(packet.generated_at).toLocaleString()} · SHA-256 {packet.packet_hash}</p></div><div className="flex gap-2"><button type="button" disabled={pending || Boolean(packet.authorization.revoked_at)} onClick={() => void download()} className="rounded bg-[#1f5a3a] px-3 py-2 text-sm font-bold text-white disabled:opacity-60">Download JSON</button><button type="button" disabled={pending || Boolean(packet.authorization.revoked_at)} onClick={() => void revoke()} className="rounded border border-[#9a5a00] px-3 py-2 text-sm font-bold text-[#765000] disabled:opacity-60">Revoke authorization</button></div></div>{packet.authorization.revoked_at && <p className="rounded-lg bg-[#fff1d6] p-3 text-sm text-[#765000]">Authorization revoked {new Date(packet.authorization.revoked_at).toLocaleString()}. New downloads are blocked.</p>}<p className="rounded-lg bg-[#f2f5f0] p-3 text-sm leading-6">{packet.packet_json.disclosure}</p><div className="space-y-3">{packet.packet_json.evidence.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-lg border border-[#dfe4dc] p-4"><h3 className="m-0 font-bold">{item.title}</h3><p className="mb-0 mt-1 text-sm text-[#657065]">{item.category.replaceAll("_", " ")} · Verification: {item.verification_status.replaceAll("_", " ")}</p><p className="mb-0 mt-2 text-xs text-[#657065]">Source: {item.source?.source_name ?? "Recorded provenance"} · Corrections: {item.corrections.length} · Review events: {item.review_state.length}</p></article>)}</div></section>}</div>;
}
