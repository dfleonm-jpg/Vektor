/**
 * Vektor — Clientes de Supabase (browser y server).
 *
 * El cliente de navegador usa la anon key (sujeta a Row Level Security). El de
 * servidor, para rutas API que necesitan saltarse RLS de forma controlada
 * (p. ej. el sync worker), usa la service role key — nunca se expone al cliente.
 */

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Cliente para el navegador (RLS activo). */
export function createSupabaseBrowserClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient(url, anonKey);
}

/** Cliente de servicio para rutas API (sin sesión; usa service role). */
export function createSupabaseServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** ¿Está Supabase configurado? Permite el fallback a estado inicial vacío. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}
