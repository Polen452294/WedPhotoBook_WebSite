"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Vinext client navigation currently fails on protected admin routes; document navigation is intentional. */
import { useState, type ReactNode } from "react";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import type { AdminUser } from "@/lib/admin-session";

export function AdminShell({ children, user }: { children: ReactNode; user: AdminUser }) {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    if (user.authMethod === "chatgpt") {
      window.location.assign(chatGPTSignOutPath("/admin/login/"));
      return;
    }
    try {
      const response = await fetch("/api/admin/session/", { method: "DELETE" });
      if (!response.ok) throw new Error("sign out failed");
      window.location.assign("/admin/login/");
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="admin-shell" data-cms-ignore>
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>W</span><div><strong>WedFotoBook</strong><small>Управление сайтом</small></div></div>
        <nav aria-label="Разделы панели управления">
          <a href="/admin/"><span aria-hidden="true">01</span>Обзор</a>
          <a href="/admin/content/"><span aria-hidden="true">02</span>Тексты сайта</a>
          <a href="/admin/code/"><span aria-hidden="true">03</span>Код сайта</a>
          <a href="/admin/zayavki/"><span aria-hidden="true">04</span>Заявки</a>
          <a href="/admin/security/"><span aria-hidden="true">05</span>Безопасность</a>
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noreferrer">Открыть сайт <span aria-hidden="true">↗</span></a>
          <div><span className="admin-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><p><strong>{user.displayName}</strong><small>Единственный пользователь</small></p></div>
          <button className="admin-signout" type="button" onClick={signOut} disabled={signingOut}>{signingOut ? "Выходим…" : "Выйти"}</button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-mobile-header"><div className="admin-brand"><span>W</span><strong>WedFotoBook</strong></div><details><summary>Разделы</summary><nav><a href="/admin/">Обзор</a><a href="/admin/content/">Тексты</a><a href="/admin/code/">Код сайта</a><a href="/admin/zayavki/">Заявки</a><a href="/admin/security/">Безопасность</a><button type="button" onClick={signOut} disabled={signingOut}>Выйти</button></nav></details></header>
        {children}
      </div>
    </div>
  );
}
