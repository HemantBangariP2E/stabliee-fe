import { createClient } from "@supabase/supabase-js";

/** Dev-only fallbacks so `npm run dev` works without .env; production must set VITE_* on the host (e.g. Netlify). */
const DEV_URL = "https://bmqnnnqowkncsxvtdcop.supabase.co";
const DEV_ANON = "sb_publishable_U900QWd_doBfYK_ToEtDoQ_78r9aTL4";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  (import.meta.env.DEV ? DEV_URL : "");
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  (import.meta.env.DEV ? DEV_ANON : "");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Stabilee] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Add them in Netlify → Environment variables, or copy .env.example to .env for local builds.",
  );
}

if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    "[Stabilee] Using dev Supabase fallbacks. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env for your project.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://invalid.supabase.co",
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid",
);