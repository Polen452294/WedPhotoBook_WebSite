import type { Metadata } from "next";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Панель управления | WedFotoBook",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
