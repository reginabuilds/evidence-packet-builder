"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function ExtractionButton({ evidenceId, title }: { evidenceId: string; title: string }) {
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  async function extract() {
    setPending(true);
    setMessage(undefined);
    try {
      const { data } = await createBrowserSupabaseClient().auth.getSession();
      if (!data.session?.access_token) throw new Error("Sign in with the fictional applicant account first.");
      const response = await fetch(`/api/evidence/${evidenceId}/extract`, { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Extraction failed.");
      setMessage(result.uncertainFields.length ? `Extracted; ${result.uncertainFields.length} field(s) need human review.` : "Extracted. This does not verify the evidence.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Extraction failed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="mt-2"><button type="button" onClick={extract} disabled={pending} className="text-xs font-bold text-[#1f5a3a] underline disabled:opacity-60">{pending ? "Extracting…" : `Extract fields from ${title}`}</button>{message && <p role="status" className="mb-0 mt-1 text-xs text-[#657065]">{message}</p>}</div>;
}
