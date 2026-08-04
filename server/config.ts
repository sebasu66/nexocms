import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const config = {
  port: Number(process.env.PORT ?? process.env.MCP_PORT ?? 3000),
  demoMode: process.env.NEXO_MCP_DEMO_MODE !== "false",
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  appUrl: process.env.NEXO_APP_URL ?? "https://nexo.example.com",
};

export function bearerToken(authorization?: string): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export function userClient(token: string): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseKey) throw new Error("Supabase is not configured for authenticated MCP requests.");
  return createClient(config.supabaseUrl, config.supabaseKey, { auth: { autoRefreshToken: false, persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
}
