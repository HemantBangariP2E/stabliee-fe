// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string || "https://bmqnnnqowkncsxvtdcop.supabase.co";     // Vite example
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string || "sb_publishable_U900QWd_doBfYK_ToEtDoQ_78r9aTL4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);