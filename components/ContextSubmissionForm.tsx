"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ContextValue = {
  evidence_id: string;
  purpose: string;
  role: string;
  actions: string;
  outcome: string;
};

export function ContextSubmissionForm() {
  const [context, setContext] = useState<ContextValue | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [role, setRole] = useState("");
  const [actions, setActions] = useState("");
  const [outcome, setOutcome] = useState("");
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/evidence/context")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Unable to load context.");
        if (body.context) {
          const value = body.context as ContextValue;
          setContext(value);
          setEvidenceId(value.evidence_id);
          setPurpose(value.purpose);
          setRole(value.role);
          setActions(value.actions);
          setOutcome(value.outcome);
          return;
        }

        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("evidence_items")
          .select("id")
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error("Unable to find your submitted artifact.");
        setEvidenceId(data?.id ?? null);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load context."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evidenceId) return setMessage("Submit an artifact first.");
    setPending(true);
    setMessage(undefined);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in with a fictional demo account first.");
      const response = await fetch("/api/evidence/context", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ evidenceId, purpose, role, actions, outcome }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to save context.");
      setContext(body.context);
      setMessage("Your context was saved with this artifact.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save context.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="text-sm text-[#657065]">Loading context submission…</p>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm">
      <div>
        <p className="m-0 text-sm font-semibold text-[#657065]">Context submission</p>
        <h2 className="mt-1 text-xl font-bold">Explain the work in your own words.</h2>
        <p className="mt-2 text-sm leading-6 text-[#59635b]">This context is student-provided and stays attached to your submitted artifact.</p>
      </div>
      {!evidenceId && <p className="rounded-lg bg-[#fff1d6] px-3 py-2 text-xs leading-5 text-[#765000]">Submit an artifact in the step above before adding context.</p>}
      <label className="block text-sm font-semibold">What was the purpose of the work?<textarea required minLength={10} maxLength={1000} value={purpose} onChange={(event) => setPurpose(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-[#cfd7ce] px-3 py-2" placeholder="Describe the task, activity, or objective." /></label>
      <label className="block text-sm font-semibold">What was your role?<textarea required minLength={3} maxLength={500} value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 min-h-20 w-full rounded-lg border border-[#cfd7ce] px-3 py-2" placeholder="Describe what you were responsible for." /></label>
      <label className="block text-sm font-semibold">What did you do?<textarea required minLength={10} maxLength={2000} value={actions} onChange={(event) => setActions(event.target.value)} className="mt-1.5 min-h-28 w-full rounded-lg border border-[#cfd7ce] px-3 py-2" placeholder="Describe the actions you personally took." /></label>
      <label className="block text-sm font-semibold">What was the outcome?<textarea required minLength={3} maxLength={1000} value={outcome} onChange={(event) => setOutcome(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-[#cfd7ce] px-3 py-2" placeholder="Describe the result without adding a score or ranking." /></label>
      <button type="submit" disabled={pending || !evidenceId} className="rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving…" : context ? "Update context" : "Save context"}</button>
      {message && <p role="status" className="text-sm text-[#4b554c]">{message}</p>}
    </form>
  );
}
