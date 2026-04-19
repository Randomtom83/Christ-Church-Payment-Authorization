/**
 * Reusable placeholder used by every route in the Sprint 0 scaffold.
 * Each page passes the title it owns and the sprint number it ships in.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  sprint: number;
  description?: string;
};

export function PagePlaceholder({ title, sprint, description }: Props) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold leading-snug text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Coming in Sprint {sprint}</CardTitle>
        </CardHeader>
        <CardContent className="text-base leading-relaxed text-muted-foreground">
          This screen is part of the project scaffold and has no functionality
          yet. The interactive build lands in Sprint {sprint} per{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            docs/workplan.md
          </code>
          .
        </CardContent>
      </Card>
    </section>
  );
}
