/**
 * Layout for unauthenticated routes (login, phone verify).
 * Centered single-column shell — no nav, no header.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-10"
      >
        {children}
      </main>
    </div>
  );
}
