"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AnalysisPayload = {
  workSummary: string;
  proposedCapabilities: Array<{ capability: string; evidenceBasis: string }>;
  supportingObservations: string[];
  limitations: string[];
  disclaimer: string;
};

type StoredAnalysis = {
  id: string;
  evidence_id: string;
  analysis_json: AnalysisPayload;
  generator_name: string;
  generator_model: string | null;
  source_mode: "ai" | "simulated";
  created_at: string;
};

export function AiAnalysisPanel() {
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    async function load() {
      try {
        const token = await accessToken();
        if (!token) throw new Error("Sign in before loading AI analysis.");
        const response = await fetch("/api/evidence/analysis", { headers: { Authorization: `Bearer ${token}` } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load AI analysis.");
        setAnalysis(body.analysis);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load AI analysis.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function accessToken() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function runAnalysis() {
    setPending(true);
    setMessage(undefined);
    try {
      const token = await accessToken();
      if (!token) throw new Error("Sign in before running AI analysis.");
      const response = await fetch("/api/evidence/analysis", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to run AI analysis.");
      setAnalysis(body.analysis);
      setMessage("AI analysis proposal created. Review it as a proposal, not verified fact.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to run AI analysis.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="text-sm text-[#657065]">Loading AI analysis…</p>;

  return (
    <article className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#1f5a3a]">Feature 06 · AI Analysis</p>
          <h2 className="mt-2 text-xl font-bold">AI-generated proposal</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59635b]">The analysis considers your private artifact and student-provided context. It is a proposal only and does not verify, certify, score, rank, or guarantee capability.</p>
        </div>
        <button type="button" onClick={runAnalysis} disabled={pending} className="shrink-0 rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Analyzing…" : analysis ? "Run again" : "Run AI analysis"}</button>
      </div>

      {message && <p role="status" className="mt-4 rounded-lg bg-[#f2f5f0] px-3 py-2 text-sm text-[#4b554c]">{message}</p>}

      {analysis && (
        <div className="mt-6 space-y-6 border-t border-[#edf0eb] pt-6">
          <div className="rounded-xl bg-[#fff8e8] p-4">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#765000]">{analysis.source_mode === "simulated" ? "Simulated AI analysis" : "AI-generated analysis"}</p>
            <p className="mt-2 text-sm leading-6 text-[#624c18]">{analysis.analysis_json.disclaimer}</p>
          </div>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Work summary</h3>
            <p className="mt-2 text-sm leading-6 text-[#263029]">{analysis.analysis_json.workSummary}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Proposed evidence-backed capabilities</h3>
            <div className="mt-3 space-y-3">
              {analysis.analysis_json.proposedCapabilities.map((item, index) => (
                <div key={`${item.capability}-${index}`} className="rounded-xl border border-[#e5e9e2] p-4">
                  <p className="font-semibold">{item.capability}</p>
                  <p className="mt-1 text-sm leading-6 text-[#59635b]">{item.evidenceBasis}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Supporting observations</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">{analysis.analysis_json.supportingObservations.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Limitations</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">{analysis.analysis_json.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <p className="text-xs leading-5 text-[#7a817a]">Generator: {analysis.generator_name}{analysis.generator_model ? ` · ${analysis.generator_model}` : ""}. This output has not been approved into an Evidence Record.</p>
        </div>
      )}
    </article>
  );
}
