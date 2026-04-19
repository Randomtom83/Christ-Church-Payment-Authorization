import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Requisitions" };

export default function RequisitionsPage() {
  return (
    <PagePlaceholder
      title="Requisitions"
      sprint={2}
      description="Submitted requisitions filtered by your role."
    />
  );
}
