import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseAdmin, hasSupabaseAuth } from "./env.js";

export const supabaseAdmin = hasSupabaseAdmin
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const supabaseAuth = hasSupabaseAuth
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
