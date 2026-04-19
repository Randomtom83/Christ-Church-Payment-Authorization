import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "New Requisition" };

export default function NewRequisitionPage() {
  return (
    <PagePlaceholder
      title="Submit a requisition"
      sprint={2}
      description="Entity, payee, amount, account code, payment method, receipt photo."
    />
  );
}
