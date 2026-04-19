/**
 * Auth helper used by `src/proxy.ts`.
 *
 * Refreshes the Supabase session cookie on every request and decides whether
 * to redirect unauthenticated users to /login. This file lives under
 * `lib/supabase/` (per CLAUDE.md file structure) and is invoked by the
 * Next.js Proxy entry point at `src/proxy.ts`.
 *
 * Routes that require authentication: anything inside the `(app)` route
 * group — i.e. /dashboard, /requisitions, /deposits, /admin, /reports.
 * Public routes: /login, /verify, plus Next internals and static assets
 * (handled by the proxy matcher).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PATH_PREFIXES = ["/login", "/verify", "/auth"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() forces a refresh of the auth token cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // Authenticated user hitting /login → bounce them to dashboard.
  if (user && (pathname === "/login" || pathname === "/")) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    dashboard.search = "";
    return NextResponse.redirect(dashboard);
  }

  // Unauthenticated user trying to reach a protected route → redirect to login.
  if (!user && !isPublicPath(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}
