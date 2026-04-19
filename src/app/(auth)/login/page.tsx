import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {APP_NAME}
        </p>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <p className="text-base text-muted-foreground leading-relaxed">
          Christ Episcopal Church — Payment &amp; Deposit Management
        </p>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
