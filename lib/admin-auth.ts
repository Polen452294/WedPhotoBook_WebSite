import { redirect } from "next/navigation";
import {
  getPasswordAdminUser,
  safeAdminReturnPath,
  type AdminUser,
} from "@/lib/admin-session";

export async function getAdminUser(): Promise<AdminUser | null> {
  return getPasswordAdminUser();
}

export async function requireAdminUser(returnTo: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;
  const safeReturnTo = safeAdminReturnPath(returnTo);
  redirect(`/admin/login/?return_to=${encodeURIComponent(safeReturnTo)}`);
}
