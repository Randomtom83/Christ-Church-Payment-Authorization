/**
 * Server-side Supabase clients.
 *
 * Two flavors:
 *   - createClient()       → user-scoped client tied to the request cookies.
 *                            RLS applies; use for normal reads/writes inside
 *                            Server Components and Server Actions.
 *   - createAdminClient()  → service-role client. Bypasses RLS. Use ONLY in
 *                            trusted server code (admin actions, webhooks,
 *                            background jobs). NEVER import from a Client
 *                            Component (CLAUDE.md, Common Mistake #10).
 *
 * Next.js 16 note: `cookies()` is async — `await cookies()` everywhere.
 */
import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Request-scoped client used by Server Components, Server Actions, and
 * Route Handlers. Cookie writes are wrapped in try/catch because Server
 * Components are not allowed to mutate cookies — the proxy handles the
 * refresh token rotation case.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Called from a Server Component — proxy will refresh cookies on
            // the next request, so silently ignore.
          }
        },
      },
    },
  );
}

/**
 * Service-role client — bypasses RLS. Server-only. Use sparingly.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local before using admin features.",
    );
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
