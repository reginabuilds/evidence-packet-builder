"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { ALLOWED_EVIDENCE_CATEGORIES } from "@/lib/association-firewall";
import { ALLOWED_FILE_TYPES, MAX_EVIDENCE_FILE_SIZE } from "@/lib/evidence-intake";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const labels: Record<(typeof ALLOWED_EVIDENCE_CATEGORIES)[number], string> = {
  sales_receipt: "Sales receipt",
  bank_deposit_record: "Bank/deposit record",
  invoice: "Invoice",
  utility_service_receipt: "Utility/service receipt",
  self_reported_activity_note: "Self-reported activity note",
};

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, "0")).join("");
}

export function EvidenceIntakeForm() {
  const [file, setFile] = useState<File>();
  const [category, setCategory] = useState<(typeof ALLOWED_EVIDENCE_CATEGORIES)[number]>("sales_receipt");
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    setFile(selected);
    setMessage(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!file) return setMessage("Choose an invented PDF, JPG, PNG, or TXT file.");
    if (file.size > MAX_EVIDENCE_FILE_SIZE || !(file.type in ALLOWED_FILE_TYPES)) return setMessage("Only PDF, JPG, PNG, and TXT files up to 10 MB are accepted.");
    if (form.get("demoOnlyConfirmed") !== "on") return setMessage("Confirm that this is invented demo evidence before uploading.");

    setPending(true);
    setMessage(undefined);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in with a fictional demo account first.");

      const intake = {
        title: String(form.get("title") ?? ""),
        category,
        documentDate: String(form.get("documentDate") ?? "") || undefined,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileHash: await sha256(file),
        demoOnlyConfirmed: true,
      };
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
      const startResponse = await fetch("/api/evidence/intake/start", { method: "POST", headers, body: JSON.stringify(intake) });
      const start = await startResponse.json();
      if (!startResponse.ok) throw new Error(start.error ?? "Unable to start upload.");

      const { error: uploadError } = await supabase.storage.from("demo-evidence").uploadToSignedUrl(start.storagePath, start.token, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const finalizeResponse = await fetch("/api/evidence/intake/finalize", { method: "POST", headers, body: JSON.stringify({ ...intake, storagePath: start.storagePath }) });
      const finalized = await finalizeResponse.json();
      if (!finalizeResponse.ok) throw new Error(finalized.error ?? "Unable to save evidence.");

      event.currentTarget.reset();
      setFile(undefined);
      setMessage(`Saved “${finalized.evidence.title}” as unverified demo evidence.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload evidence.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm">
      <div>
        <p className="m-0 text-sm font-semibold text-[#657065]">Evidence intake</p>
        <h2 className="mt-1 text-xl font-bold">Upload invented demo evidence</h2>
      </div>
      <label className="block text-sm font-semibold">Title<input name="title" required minLength={3} maxLength={120} className="mt-1.5 w-full rounded-lg border border-[#cfd7ce] px-3 py-2" placeholder="Example: Demo market sales receipt" /></label>
      <label className="block text-sm font-semibold">Evidence category<select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="mt-1.5 w-full rounded-lg border border-[#cfd7ce] bg-white px-3 py-2">{ALLOWED_EVIDENCE_CATEGORIES.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
      <label className="block text-sm font-semibold">Document date (optional)<input name="documentDate" type="date" className="mt-1.5 w-full rounded-lg border border-[#cfd7ce] px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Demo file<input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.txt,application/pdf,image/jpeg,image/png,text/plain" onChange={selectFile} className="mt-1.5 block w-full text-sm" /></label>
      <p className="m-0 text-xs leading-5 text-[#657065]">Private upload only. PDF, JPG, PNG, or TXT; maximum 10 MB. Do not upload real personal or financial documents.</p>
      <label className="flex gap-2 text-sm leading-5"><input name="demoOnlyConfirmed" type="checkbox" required className="mt-1" />I confirm this file is invented demo evidence and contains no real person’s data.</label>
      <p className="rounded-lg bg-[#fff1d6] px-3 py-2 text-xs leading-5 text-[#765000]">Association-based evidence—such as referrals, contacts, relatives, networks, community affiliation, or reputation—is not accepted.</p>
      <button type="submit" disabled={pending} className="rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Uploading privately…" : "Upload demo evidence"}</button>
      {message && <p role="status" className="text-sm text-[#4b554c]">{message}</p>}
    </form>
  );
}
