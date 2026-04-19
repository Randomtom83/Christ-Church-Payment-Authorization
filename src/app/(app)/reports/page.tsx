import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Reports & exports"
      sprint={7}
      description="QuickBooks-ready CSV exports, monthly summaries, audit log."
    />
  );
}
