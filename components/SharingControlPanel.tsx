"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ShareState = { sharingActive: boolean; shareUrl: string | null; createdAt?: string; revokedAt?: string };

export function SharingControlPanel() {
  const [state, setState] = useState<ShareState | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function token() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function load() {
    const accessToken = await token();
    if (!accessToken) throw new Error("Sign in before managing sharing.");
    const response = await fetch("/api/evidence/share", { headers: { Authorization: `Bearer ${accessToken}` } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load sharing status.");
    setState(body);
  }

  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load sharing status.")).finally(() => setLoading(false)); }, []);

  async function enable() {
    setPending(true); setMessage(undefined);
    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Sign in before enabling sharing.");
      const response = await fetch("/api/evidence/share", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to enable sharing.");
      setState(body);
      setMessage("Sharing is active. Only the approved Evidence Record is exposed through this link.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to enable sharing."); }
    finally { setPending(false); }
  }

  async function revoke() {
    setPending(true); setMessage(undefined);
    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Sign in before revoking sharing.");
      const response = await fetch("/api/evidence/share", { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to revoke sharing.");
      setState(body);
      setMessage("Sharing revoked. The shared link no longer provides access.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to revoke sharing."); }
    finally { setPending(false); }
  }

  if (loading) return <p className="text-sm text-[#657065]">Loading sharing controls…</p>;

  return (
    <article className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm sm:p-7">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#1f5a3a]">Feature 09 · Sharing control</p>
      <h2 className="mt-2 text-xl font-bold">Control your shared Evidence Record</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59635b]">Sharing is off until you activate it. Only an Evidence Record that you explicitly approved can be shared. Revoking sharing immediately disables the bearer link.</p>
      {message && <p role="status" className="mt-4 rounded-lg bg-[#f2f5f0] px-3 py-2 text-sm text-[#4b554c]">{message}</p>}
      <div className="mt-5 rounded-xl border border-[#dfe4dc] bg-[#fbfcfa] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#657065]">Sharing status</p><p className="mt-1 text-sm font-semibold text-[#263029]">{state?.sharingActive ? "Active" : "Not shared"}</p></div>
          {!state?.sharingActive ? <button type="button" onClick={enable} disabled={pending} className="rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Activating…" : "Activate sharing"}</button> : <button type="button" onClick={revoke} disabled={pending} className="rounded-lg border border-[#b45f4b] bg-white px-4 py-2.5 text-sm font-bold text-[#8d4637] disabled:opacity-60">{pending ? "Revoking…" : "Revoke sharing"}</button>}
        </div>
        {state?.sharingActive && state.shareUrl && <div className="mt-4 border-t border-[#e7ebe5] pt-4"><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#657065]">Shared link</p><div className="mt-2 break-all rounded-lg bg-white px-3 py-2 text-sm text-[#263029]">{state.shareUrl}</div><p className="mt-2 text-xs leading-5 text-[#657065]">This link is a bearer credential. Share it only with people you intend to give access to.</p></div>}
      </div>
    </article>
  );
}
