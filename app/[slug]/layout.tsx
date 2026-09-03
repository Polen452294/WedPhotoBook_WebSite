import type { ReactNode } from "react";
import { ClientRuntime } from "@/components/ClientRuntime";

// Every inner page needs the same order dialog, including early-return
// article and pricing routes. Keep it outside the page's content branches.
export default function PublicPageLayout({ children }: { children: ReactNode }) {
  return <>{children}<ClientRuntime /></>;
}
