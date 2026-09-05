"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type RecordPayload = {
  recordVersion: 1;
  status: "draft" | "approved";
  approvalStatus: "not_yet_approved" | "approved_by_student";
  studentApprovedInformation: { available: boolean; note: string; approvedAt?: string };
  studentProvided: { artifact: { evidenceId: string; title: string; category: string; originalFilename: string | null; submittedAt: string }; context: { purpose: string; role: string; actions: string; outcome: string } };
  aiGeneratedProposal: { analysisId: string; sourceMode: "ai" | "simulated"; generatorName: string; generatorModel: string | null; workSummary: string; proposedCapabilities: Array<{ capability: string; evidenceBasis: string }>; supportingObservations: string[]; limitations: string[]; disclaimer: string };
  boundaries: string[];
  generatedAt: string;
};
type StoredRecord = { id: string; evidence_id: string; record_version: number; status: string; approval_status: string; record_json: RecordPayload; created_at: string; approved_at?: string | null; approved_by?: string | null };

export function EvidenceRecordPanel() {
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [confirmApproval, setConfirmApproval] = useState(false);

  async function accessToken() { const supabase = createBrowserSupabaseClient(); const { data } = await supabase.auth.getSession(); return data.session?.access_token ?? null; }

  async function loadRecord() {
    const token = await accessToken();
    if (!token) throw new Error("Sign in before loading the Evidence Record.");
    const response = await fetch("/api/evidence/record", { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load the Evidence Record.");
    setRecord(body.record);
  }

  useEffect(() => { loadRecord().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load the Evidence Record.")).finally(() => setLoading(false)); }, []);

  async function generateRecord() {
    setPending(true); setMessage(undefined); setConfirmApproval(false);
    try { const token = await accessToken(); if (!token) throw new Error("Sign in before generating the Evidence Record."); const response = await fetch("/api/evidence/record", { method: "POST", headers: { Authorization: `Bearer ${token}` } }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Unable to generate the Evidence Record."); setRecord(body.record); setMessage("Draft Evidence Record generated. Review it before approving."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to generate the Evidence Record."); }
    finally { setPending(false); }
  }

  async function approveRecord() {
    setPending(true); setMessage(undefined);
    try { const token = await accessToken(); if (!token) throw new Error("Sign in before approving the Evidence Record."); const response = await fetch("/api/evidence/record/approve", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ confirmApproval: true }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Unable to approve the Evidence Record."); setRecord(body.record); setConfirmApproval(false); setMessage("Evidence Record approved by you. AI content remains labeled as a proposal."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to approve the Evidence Record."); }
    finally { setPending(false); }
  }

  if (loading) return <p className="text-sm text-[#657065]">Loading Evidence Record…</p>;
  const approved = record?.approval_status === "approved_by_student";

  return (
    <article className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#1f5a3a]">Feature 08 · Review & approval</p><h2 className="mt-2 text-xl font-bold">Review your Evidence Record</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#59635b]">You are the final decision-maker. Review the student-provided information and the separate AI proposal before choosing whether to approve this record.</p></div>
        {!approved && <button type="button" onClick={generateRecord} disabled={pending} className="shrink-0 rounded-lg border border-[#1f5a3a] bg-white px-4 py-2.5 text-sm font-bold text-[#1f5a3a] disabled:opacity-60">{pending ? "Working…" : "Generate new draft"}</button>}
      </div>

      {message && <p role="status" className="mt-4 rounded-lg bg-[#f2f5f0] px-3 py-2 text-sm text-[#4b554c]">{message}</p>}

      {record && <div className="mt-6 space-y-6 border-t border-[#edf0eb] pt-6">
        <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#f2f5f0] px-3 py-1 text-[#4b554c]">{approved ? "Approved ·" : "Draft ·"} v{record.record_version}</span><span className="rounded-full bg-[#fff1d6] px-3 py-1 text-[#765000]">{approved ? "Approved by student" : "Not yet student-approved"}</span></div>

        <section><h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Student-provided information</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Artifact" value={record.record_json.studentProvided.artifact.title} /><Field label="File" value={record.record_json.studentProvided.artifact.originalFilename ?? "Original artifact"} /><Field label="Purpose" value={record.record_json.studentProvided.context.purpose} /><Field label="Role" value={record.record_json.studentProvided.context.role} /><Field label="Actions" value={record.record_json.studentProvided.context.actions} wide /><Field label="Outcome" value={record.record_json.studentProvided.context.outcome} wide /></div></section>

        <section className="rounded-xl border border-[#eadfbd] bg-[#fffaf0] p-4"><p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#765000]">AI-generated / simulated proposal</p><p className="mt-2 text-sm leading-6 text-[#624c18]">{record.record_json.aiGeneratedProposal.disclaimer}</p><h3 className="mt-5 text-sm font-bold">Proposed capabilities</h3><div className="mt-3 space-y-3">{record.record_json.aiGeneratedProposal.proposedCapabilities.map((item, index) => <div key={`${item.capability}-${index}`} className="rounded-lg border border-[#eadfbd] bg-white p-3"><p className="font-semibold">{item.capability}</p><p className="mt-1 text-sm leading-6 text-[#59635b]">{item.evidenceBasis}</p></div>)}</div><h3 className="mt-5 text-sm font-bold">Limitations</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">{record.record_json.aiGeneratedProposal.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>

        <div className="rounded-xl bg-[#f2f5f0] p-4 text-sm leading-6 text-[#4b554c]">{record.record_json.studentApprovedInformation.note}</div>

        {!approved && <div className="rounded-xl border border-[#dfe4dc] bg-[#fbfcfa] p-4"><label className="flex items-start gap-3 text-sm leading-6 text-[#263029]"><input type="checkbox" checked={confirmApproval} onChange={(event) => setConfirmApproval(event.target.checked)} className="mt-1 h-4 w-4" /><span>I reviewed this draft and explicitly approve this Evidence Record as written. I understand that the AI-generated / simulated section remains a proposal and is not verified fact.</span></label><button type="button" onClick={approveRecord} disabled={!confirmApproval || pending} className="mt-4 rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Approving…" : "Approve Evidence Record"}</button></div>}
      </div>}
    </article>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : ""}><p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#657065]">{label}</p><p className="mt-1 text-sm leading-6 text-[#263029]">{value}</p></div>; }
