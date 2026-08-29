import { AdminContentEditor } from "@/components/AdminContentEditor";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminUser } from "@/lib/admin-auth";
import { editablePages } from "@/lib/editable-pages";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const user = await requireAdminUser("/admin/content/");
  return <AdminShell user={user}><AdminContentEditor pages={[...editablePages]} /></AdminShell>;
}
