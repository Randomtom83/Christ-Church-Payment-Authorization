/**
 * Next.js Proxy entry point (formerly `middleware.ts` in Next 15 and earlier).
 *
 * Runs on every request that matches the `matcher` below. Delegates session
 * refresh + auth-gating logic to `lib/supabase/middleware.ts` so the rules
 * stay co-located with the Supabase client setup.
 */
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     *  - _next/static, _next/image (build assets)
     *  - favicon, manifest, icons, robots
     *  - any file with an extension under /public (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
