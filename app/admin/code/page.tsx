import { AdminCodeEditor } from "@/components/AdminCodeEditor";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCodePage() {
  const user = await requireAdminUser("/admin/code/");
  return <AdminShell user={user}><AdminCodeEditor /></AdminShell>;
}
