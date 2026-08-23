"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type QueueItem = { id: string; evidence_id: string; reason_code: string; state: string; created_at: string; evidence_items: { title: string; category: string; verification_status: string } | null };
type ReviewDetail = { item: QueueItem & { details_json: unknown }; evidence: Record<string, unknown>; provenance: Record<string, unknown> | null; extractions: Array<Record<string, unknown>>; events: Array<Record<string, unknown>>; corrections: Array<Record<string, unknown>>; resolution: { decision: string; resolution_note: string } | null };

function PrettyJson({ value }: { value: unknown }) {
  return <pre className="overflow-x-auto rounded-lg bg-[#f2f5f0] p-3 text-xs leading-5 text-[#344036]">{JSON.stringify(value, null, 2)}</pre>;
}

export function ReviewerQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<ReviewDetail>();
  const [message, setMessage] = useState<string | undefined>("Loading your assigned review queue…");
  const [pending, setPending] = useState(false);

  async function authHeaders() {
    const { data } = await createBrowserSupabaseClient().auth.getSession();
    if (!data.session?.access_token) throw new Error("Sign in with the fictional reviewer account first.");
    return { Authorization: `Bearer ${data.session.access_token}` };
  }

  async function loadQueue() {
    try {
      const response = await fetch("/api/review/queue", { headers: await authHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load assigned reviews.");
      setItems(result.items);
      setMessage(result.items.length ? "Select an assigned item to inspect source and history." : "No review items are assigned to this reviewer.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load assigned reviews."); }
  }

  useEffect(() => { void loadQueue(); }, []);

  async function openItem(id: string) {
    setPending(true); setMessage(undefined);
    try {
      const response = await fetch(`/api/review/${id}`, { headers: await authHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load review detail.");
      setSelected(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load review detail."); } finally { setPending(false); }
  }

  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setMessage(undefined);
    try {
      const response = await fetch(`/api/review/${selected.item.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ decision: form.get("decision"), resolutionNote: form.get("resolutionNote") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to resolve review item.");
      setMessage(`Human reviewer resolution saved: ${result.decision}.`);
      await loadQueue();
      setSelected(undefined);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to resolve review item."); } finally { setPending(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]"><section className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="m-0 text-sm font-semibold text-[#657065]">Assigned items only</p><h2 className="mt-1 text-xl font-bold">Human-review queue</h2></div><button type="button" onClick={() => void loadQueue()} className="text-sm font-bold text-[#1f5a3a] underline">Refresh</button></div><div className="mt-4 space-y-2">{items.map((item) => <button type="button" key={item.id} onClick={() => void openItem(item.id)} disabled={pending} className="w-full rounded-lg border border-[#dfe4dc] p-3 text-left hover:border-[#1f5a3a] disabled:opacity-60"><p className="m-0 font-bold">{item.evidence_items?.title ?? "Evidence item"}</p><p className="mb-0 mt-1 text-xs text-[#657065]">{item.reason_code.replaceAll("_", " ")} · {item.state.replaceAll("_", " ")}</p></button>)}</div>{message && <p role="status" className="mt-4 text-sm leading-6 text-[#4b554c]">{message}</p>}</section><section className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm">{!selected ? <div><p className="m-0 text-sm font-semibold text-[#657065]">Reviewer workspace</p><h2 className="mt-1 text-xl font-bold">Inspect evidence before resolving</h2><p className="text-sm leading-6 text-[#657065]">Reviewers can examine source provenance, extraction output, applicant corrections, and the audit history. Automated processes cannot resolve this case.</p></div> : <div className="space-y-5"><div><p className="m-0 text-sm font-semibold text-[#657065]">Review item · {selected.item.reason_code.replaceAll("_", " ")}</p><h2 className="mt-1 text-xl font-bold">{String(selected.evidence.title)}</h2><p className="mb-0 text-sm text-[#657065]">Current status: {String(selected.evidence.verification_status)}</p></div><details open><summary className="cursor-pointer font-bold">Evidence and provenance</summary><div className="mt-2"><PrettyJson value={{ evidence: selected.evidence, provenance: selected.provenance }} /></div></details><details><summary className="cursor-pointer font-bold">Structured extraction and confidence</summary><div className="mt-2"><PrettyJson value={selected.extractions} /></div></details><details><summary className="cursor-pointer font-bold">Applicant corrections</summary><div className="mt-2"><PrettyJson value={selected.corrections} /></div></details><details><summary className="cursor-pointer font-bold">Transformation audit trail</summary><div className="mt-2"><PrettyJson value={selected.events} /></div></details>{selected.item.state !== "resolved" ? <form onSubmit={resolve} className="space-y-3 rounded-xl border border-[#cfe0d1] bg-[#f4faf4] p-4"><p className="m-0 text-sm font-bold">Human reviewer resolution</p><label className="block text-sm font-semibold">Decision<select name="decision" className="mt-1 block w-full rounded border border-[#cfd7ce] bg-white p-2"><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="needs_applicant_clarification">Needs applicant clarification</option></select></label><label className="block text-sm font-semibold">Resolution note<textarea name="resolutionNote" required minLength={1} maxLength={2000} className="mt-1 block w-full rounded border border-[#cfd7ce] p-2" /></label><button type="submit" disabled={pending} className="rounded bg-[#1f5a3a] px-4 py-2 font-bold text-white disabled:opacity-60">Record human resolution</button></form> : <p className="rounded-lg bg-[#f2f5f0] p-3 text-sm">This review item is resolved. Resolution: {selected.resolution?.decision ?? "recorded"}.</p>}</div>}</section></div>;
}
