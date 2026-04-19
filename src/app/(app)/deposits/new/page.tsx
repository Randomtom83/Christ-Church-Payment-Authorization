import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "New Deposit" };

export default function NewDepositPage() {
  return (
    <PagePlaceholder
      title="Start a counting session"
      sprint={5}
      description="Photograph checks, enter cash and pledge totals, run two-counter verification."
    />
  );
}
