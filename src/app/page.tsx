import { redirect } from "next/navigation";

/**
 * The root path is a no-op — the proxy redirects unauthenticated visitors to
 * /login and authenticated visitors to /dashboard before this component
 * renders. This redirect is the safety net if the proxy matcher ever misses.
 */
export default function RootPage() {
  redirect("/dashboard");
}
