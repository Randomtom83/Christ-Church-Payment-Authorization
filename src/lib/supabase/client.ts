/**
 * Browser Supabase client.
 *
 * Use only in Client Components. For Server Components, Server Actions,
 * Route Handlers, or middleware, use the helpers in `./server` instead.
 *
 * Per CLAUDE.md "Architecture Rules → Data Flow", client-side reads should
 * be avoided where a Server Component will do; reach for this only when
 * realtime subscriptions or browser-only APIs are unavoidable.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
