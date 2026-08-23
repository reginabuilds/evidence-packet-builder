"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Browser client for the fictional demo accounts only. Environment variables are
 * deliberately read at call time so the static shell still builds without a project.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Demo authentication is not configured. Add Supabase values to .env.local.");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}
