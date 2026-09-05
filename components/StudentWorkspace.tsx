"use client";

import { useEffect, useState } from "react";
import { EvidenceIntakeForm } from "@/components/EvidenceIntakeForm";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const STATUS = {
  record: "Not started",
  review: "Not started",
  sharing: "Not shared",
} as const;

export default function StudentWorkspace() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session?.user) {
        window.location.replace("/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        window.location.replace("/login");
        return;
      }
      setEmail(session.user.email ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] p-6">
        <p className="text-sm text-[#657065]">Loading your workspace…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#172019]">
      <header className="border-b border-[#dfe4dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#1f5a3a]">EVIDENCE</p>
            <p className="m-0 text-sm font-medium text-[#657065]">Student workspace</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#657065] sm:inline">{email}</span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-[#cfd7ce] bg-white px-3 py-2 text-sm font-semibold text-[#263029] hover:bg-[#f2f5f0]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="max-w-3xl">
          <p className="mb-2 text-sm font-semibold text-[#1f5a3a]">Your evidence</p>
          <h1 className="m-0 text-3xl font-bold tracking-tight sm:text-4xl">Build one clear record of real work.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#59635b]">
            EVIDENCE helps you organize one piece of real work into an Evidence Record that you control.
          </p>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <EvidenceIntakeForm />
          </div>

          <article className="rounded-2xl border border-[#dfe4dc] bg-white p-6 shadow-sm sm:p-7">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#657065]">Evidence Record</p>
            <h2 className="mt-2 text-xl font-bold">Current status</h2>
            <div className="mt-5 space-y-4">
              <StatusRow label="Record" value={STATUS.record} />
              <StatusRow label="Review & approval" value={STATUS.review} />
              <StatusRow label="Sharing" value={STATUS.sharing} />
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-[#dfe4dc] bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-[#657065]">Your control</p>
              <h2 className="mt-2 text-xl font-bold">You own what enters your Evidence Record.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59635b]">
                Your original upload is preserved as private evidence. Later review and sharing steps remain separate from this submission stage.
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-[#f2f5f0] px-4 py-3 text-center text-xs font-semibold text-[#4b554c]">
              Student-owned
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf0eb] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[#59635b]">{label}</span>
      <span className="text-sm font-semibold text-[#263029]">{value}</span>
    </div>
  );
}
