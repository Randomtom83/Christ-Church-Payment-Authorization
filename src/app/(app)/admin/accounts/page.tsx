import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Chart of Accounts" };

export default function AdminAccountsPage() {
  return (
    <PagePlaceholder
      title="Chart of accounts"
      sprint={2}
      description="Manage church and NSCC account codes used by requisitions and deposits."
    />
  );
}
