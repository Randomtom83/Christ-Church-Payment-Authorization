import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Requisition Detail" };

// Next.js 16: dynamic route params are async.
export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PagePlaceholder
      title={`Requisition #${id}`}
      sprint={3}
      description="Full requisition view with backup documents and approval actions."
    />
  );
}
