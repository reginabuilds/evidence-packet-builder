"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type RecordPayload = {
  recordVersion: 1;
  status: "draft";
  approvalStatus: "not_yet_approved";
  studentApprovedInformation: { available: false; note: string };
  studentProvided: {
    artifact: { evidenceId: string; title: string; category: string; originalFilename: string | null; submittedAt: string };
    context: { purpose: string; role: string; actions: string; outcome: string };
  };
  aiGeneratedProposal: {
    analysisId: string;
    sourceMode: "ai" | "simulated";
    generatorName: string;
    generatorModel: string | null;
    workSummary: string;
    proposedCapabilities: Array<{ capability: string; evidenceBasis: string }>;
    supportingObservations: string[];
    limitations: string[];
    disclaimer: string;
  };
  boundaries: string[];
  generatedAt: string;
};

type StoredRecord = { id: string; evidence_id: string; record_version: number; status: string; approval_status: string; record_json: RecordPayload; created_at: string };

export function EvidenceRecordPanel() {
  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function accessToken() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  useEffect(() => {
    async function load() {
      try {
        const token = await accessToken();
        if (!token) throw new Error("Sign in before loading the Evidence Record.");
        const response = await fetch("/api/evidence/record", { headers: { Authorization: `Bearer ${token}` } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load the Evidence Record.");
        setRecord(body.record);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load the Evidence Record.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function generateRecord() {
    setPending(true);
    setMessage(undefined);
    try {
      const token = await accessToken();
      if (!token) throw new Error("Sign in before generating the Evidence Record.");
      const response = await fetch("/api/evidence/record", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to generate the Evidence Record.");
      setRecord(body.record);
      setMessage("Draft Evidence Record generated. It is not yet student-approved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate the Evidence Record.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="text-sm text-[#657065]">Loading Evidence Record…</p>;

  return (
    <article className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#1f5a3a]">Feature 07 · Evidence Record</p>
          <h2 className="mt-2 text-xl font-bold">Draft Evidence Record</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59635b]">The record combines your submitted artifact, your own context, and the separate AI proposal. AI content stays labeled as a proposal and is not treated as verified fact.</p>
        </div>
        <button type="button" onClick={generateRecord} disabled={pending} className="shrink-0 rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Generating…" : record ? "Generate new draft" : "Generate draft"}</button>
      </div>

      {message && <p role="status" className="mt-4 rounded-lg bg-[#f2f5f0] px-3 py-2 text-sm text-[#4b554c]">{message}</p>}

      {record && (
        <div className="mt-6 space-y-6 border-t border-[#edf0eb] pt-6">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#f2f5f0] px-3 py-1 text-[#4b554c]">Draft · v{record.record_version}</span>
            <span className="rounded-full bg-[#fff1d6] px-3 py-1 text-[#765000]">Not yet student-approved</span>
          </div>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Student-provided information</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Artifact" value={record.record_json.studentProvided.artifact.title} />
              <Field label="File" value={record.record_json.studentProvided.artifact.originalFilename ?? "Original artifact"} />
              <Field label="Purpose" value={record.record_json.studentProvided.context.purpose} />
              <Field label="Role" value={record.record_json.studentProvided.context.role} />
              <Field label="Actions" value={record.record_json.studentProvided.context.actions} wide />
              <Field label="Outcome" value={record.record_json.studentProvided.context.outcome} wide />
            </div>
          </section>

          <section className="rounded-xl border border-[#eadfbd] bg-[#fffaf0] p-4">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#765000]">AI-generated / simulated proposal</p>
            <p className="mt-2 text-sm leading-6 text-[#624c18]">{record.record_json.aiGeneratedProposal.disclaimer}</p>
            <h3 className="mt-5 text-sm font-bold">Proposed capabilities</h3>
            <div className="mt-3 space-y-3">
              {record.record_json.aiGeneratedProposal.proposedCapabilities.map((item, index) => <div key={`${item.capability}-${index}`} className="rounded-lg border border-[#eadfbd] bg-white p-3"><p className="font-semibold">{item.capability}</p><p className="mt-1 text-sm leading-6 text-[#59635b]">{item.evidenceBasis}</p></div>)}
            </div>
            <h3 className="mt-5 text-sm font-bold">Limitations</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">{record.record_json.aiGeneratedProposal.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <div className="rounded-xl bg-[#f2f5f0] p-4 text-sm leading-6 text-[#4b554c]">{record.record_json.studentApprovedInformation.note}</div>
        </div>
      )}
    </article>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#657065]">{label}</p><p className="mt-1 text-sm leading-6 text-[#263029]">{value}</p></div>;
}
