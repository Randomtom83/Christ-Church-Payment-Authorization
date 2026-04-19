import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Deposits" };

export default function DepositsPage() {
  return (
    <PagePlaceholder
      title="Deposits"
      sprint={5}
      description="History of Sunday counter sessions and verification status."
    />
  );
}
