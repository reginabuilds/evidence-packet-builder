"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Proposal = {
  capability: string;
  supportingEvidence?: Array<{ description: string; reference: string }>;
  explanation?: string;
  evidenceBasis: string;
};

type Analysis = {
  id: string;
  analysis_json: {
    proposedCapabilities: Proposal[];
  };
};

type Review = {
  proposal_index: number;
  decision: "accepted" | "rejected";
  student_id: string;
  decided_at: string;
};

export function StudentReviewPanel() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    loadReview();
  }, []);

  async function accessToken() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function loadReview() {
    setLoading(true);
    try {
      const token = await accessToken();
      if (!token) throw new Error("Sign in before reviewing proposals.");
      const response = await fetch("/api/evidence/review", { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load student review.");
      setAnalysis(body.analysis);
      setReviews(body.decisions ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load student review.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(proposalIndex: number, decision: "accepted" | "rejected") {
    setPending(proposalIndex);
    setMessage(undefined);
    try {
      const token = await accessToken();
      if (!token) throw new Error("Sign in before reviewing proposals.");
      if (!analysis) throw new Error("AI proposal not found.");
      const response = await fetch("/api/evidence/review", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id, proposalIndex, decision }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to save student decision.");
      setReviews((current) => {
        const next = current.filter((review) => review.proposal_index !== proposalIndex);
        return [...next, body.review];
      });
      setMessage(decision === "accepted" ? "Proposal accepted by student." : "Proposal rejected by student.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save student decision.");
    } finally {
      setPending(null);
    }
  }

  if (loading) return <p className="text-sm text-[#657065]">Loading student review…</p>;
  if (!analysis) return null;

  return (
    <article className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#1f5a3a]">Feature 07 · Student review</p>
        <h2 className="mt-2 text-xl font-bold">Student review</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59635b]">Review each AI-generated proposal before deciding what should move forward. Your decision is separate from the AI analysis and is attributable to your authenticated account.</p>
      </div>

      {message && <p role="status" className="mt-4 rounded-lg bg-[#f2f5f0] px-3 py-2 text-sm text-[#4b554c]">{message}</p>}

      <div className="mt-6 space-y-4 border-t border-[#edf0eb] pt-6">
        {analysis.analysis_json.proposedCapabilities.map((item, index) => {
          const review = reviews.find((candidate) => candidate.proposal_index === index);
          return (
            <section key={`${analysis.id}-${index}`} className="rounded-xl border border-[#e5e9e2] p-4">
              <div className="rounded-lg bg-[#fff8e8] px-3 py-2">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#765000]">AI proposal</p>
                <p className="mt-1 text-sm font-semibold text-[#624c18]">Evidence-backed capability: {item.capability}</p>
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-[#657065]">Supporting evidence</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-[#59635b]">
                {(item.supportingEvidence ?? [{ description: item.evidenceBasis, reference: "AI-generated proposal" }]).map((evidence, evidenceIndex) => (
                  <li key={`${evidence.reference}-${evidenceIndex}`} className="rounded-lg bg-[#f7f9f5] px-3 py-2">
                    <span>{evidence.description}</span>
                    <span className="mt-1 block text-xs text-[#7a817a]">Reference: {evidence.reference}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-[#657065]">Why the evidence supports it</p>
              <p className="mt-1 text-sm leading-6 text-[#59635b]">{item.explanation ?? item.evidenceBasis}</p>

              <div className="mt-5 rounded-lg border border-[#dfe4dc] bg-[#fbfcfa] p-3">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#657065]">Student decision</p>
                {review ? (
                  <p className="mt-1 text-sm font-semibold">{review.decision === "accepted" ? "Accepted by student" : "Rejected by student"}</p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-[#59635b]">Not reviewed yet. The AI proposal does not count as a student decision.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => decide(index, "accepted")} disabled={pending !== null} className="rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending === index ? "Saving…" : "Accept proposal"}</button>
                      <button type="button" onClick={() => decide(index, "rejected")} disabled={pending !== null} className="rounded-lg border border-[#b9c2b8] bg-white px-4 py-2.5 text-sm font-bold text-[#263029] disabled:opacity-60">Reject proposal</button>
                    </div>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
