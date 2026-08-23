"use client";

import { FormEvent, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const DEMO_PASSWORD = "DemoOnly-NotForProduction-2026!";

export function DemoSignInForm() {
  const [email, setEmail] = useState("lucia.demo@evidence-packet.test");
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
      if (error) throw error;
      window.location.assign("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in to the demo workspace.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={signIn} className="space-y-4">
      <label className="block text-sm font-semibold" htmlFor="demo-email">
        Demo account
        <select
          id="demo-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[#cfd7ce] bg-white px-3 py-2.5 text-sm"
        >
          <option value="lucia.demo@evidence-packet.test">Lucía Morales — applicant</option>
          <option value="reviewer.demo@evidence-packet.test">Mariana Cruz — reviewer</option>
        </select>
      </label>
      <p className="rounded-lg bg-[#f2f5f0] px-3 py-2 text-xs leading-5 text-[#4b554c]">
        Both accounts use a published, fictional local-demo password. Never create or onboard new users from this screen.
      </p>
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Signing in…" : "Enter demo workspace"}
      </button>
      {message && <p role="alert" className="text-sm text-[#9a3a32]">{message}</p>}
    </form>
  );
}
