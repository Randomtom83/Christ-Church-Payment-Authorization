import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Requisition Templates" };

export default function RequisitionTemplatesPage() {
  return (
    <PagePlaceholder
      title="Requisition templates"
      sprint={2}
      description="Save recurring expenses for one-tap submission."
    />
  );
}
