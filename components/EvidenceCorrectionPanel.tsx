"use client";

import { FormEvent, useState } from "react";
import { CORRECTABLE_FIELDS, type CorrectableField } from "@/lib/evidence-correction";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const labels: Record<CorrectableField, string> = {
  evidenceType: "Evidence type",
  issuerOrSourceName: "Issuer or source name",
  documentDate: "Document date",
  activityDate: "Activity date",
  amount: "Amount",
  currency: "Currency (ISO code)",
  statedActivity: "Stated activity",
};

export function EvidenceCorrectionPanel({ evidenceId }: { evidenceId: string }) {
  const [field, setField] = useState<CorrectableField>("statedActivity");
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  async function request(path: string, body: Record<string, unknown>) {
    const { data } = await createBrowserSupabaseClient().auth.getSession();
    if (!data.session?.access_token) throw new Error("Sign in with the fictional applicant account first.");
    const response = await fetch(`/api/evidence/${evidenceId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Unable to update evidence.");
    return result;
  }

  async function correct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true); setMessage(undefined);
    try {
      const rawValue = String(form.get("value") ?? "");
      const value = field === "amount" ? Number(rawValue) : rawValue;
      await request("correct", { field, value, reason: String(form.get("reason") ?? "") });
      setMessage("Correction saved and sent to human review. It is not verification.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save correction."); } finally { setPending(false); }
  }

  async function exclude(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true); setMessage(undefined);
    try {
      await request("exclude", { reason: String(form.get("excludeReason") ?? "") });
      setMessage("Evidence is excluded from future packets; the audit history remains preserved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to exclude evidence."); } finally { setPending(false); }
  }

  const inputType = field === "amount" ? "number" : field === "documentDate" || field === "activityDate" ? "date" : "text";
  return <details className="mt-3 rounded-lg border border-[#dfe4dc] p-3 text-sm"><summary className="cursor-pointer font-bold">Question, correct, or exclude this evidence</summary><div className="mt-3 space-y-4"><form onSubmit={correct} className="space-y-2"><label className="block font-semibold">Field<select value={field} onChange={(event) => setField(event.target.value as CorrectableField)} className="mt-1 block w-full rounded border border-[#cfd7ce] p-2">{CORRECTABLE_FIELDS.map((item) => <option value={item} key={item}>{labels[item]}</option>)}</select></label><label className="block font-semibold">Corrected value<input name="value" type={inputType} required min={field === "amount" ? "0" : undefined} step={field === "amount" ? "0.01" : undefined} maxLength={field === "currency" ? 3 : undefined} className="mt-1 block w-full rounded border border-[#cfd7ce] p-2" /></label><label className="block font-semibold">Why is this inaccurate?<textarea name="reason" required minLength={1} maxLength={2000} className="mt-1 block w-full rounded border border-[#cfd7ce] p-2" /></label><button type="submit" disabled={pending} className="rounded bg-[#1f5a3a] px-3 py-2 font-bold text-white disabled:opacity-60">Save correction</button></form><form onSubmit={exclude} className="border-t border-[#dfe4dc] pt-3"><label className="block font-semibold">Why is this evidence irrelevant?<textarea name="excludeReason" required minLength={1} maxLength={2000} className="mt-1 block w-full rounded border border-[#cfd7ce] p-2" /></label><button type="submit" disabled={pending} className="mt-2 rounded border border-[#9a5a00] px-3 py-2 font-bold text-[#765000] disabled:opacity-60">Exclude from packet</button></form>{message && <p role="status" className="mb-0 text-xs leading-5 text-[#4b554c]">{message}</p>}</div></details>;
}
