import { redirect } from "next/navigation";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getPasswordAdminUser,
  safeAdminReturnPath,
  type AdminUser,
} from "@/lib/admin-session";

export function allowedAdminEmails(): Set<string> {
  const configured = process.env.ADMIN_EMAILS ?? "";
  return new Set(configured.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export function configuredAdminCount(): number {
  return allowedAdminEmails().size;
}

export function isAllowedAdminEmail(email: string): boolean {
  return allowedAdminEmails().has(email.trim().toLowerCase());
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const passwordUser = await getPasswordAdminUser();
  if (passwordUser) return passwordUser;

  const user = await getChatGPTUser();
  return user && isAllowedAdminEmail(user.email) ? { ...user, authMethod: "chatgpt" } : null;
}

export async function requireAdminUser(returnTo: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;
  const safeReturnTo = safeAdminReturnPath(returnTo);
  redirect(`/admin/login/?return_to=${encodeURIComponent(safeReturnTo)}`);
}
