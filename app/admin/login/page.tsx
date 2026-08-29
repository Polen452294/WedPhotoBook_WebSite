/* eslint-disable @next/next/no-html-link-for-pages -- Vinext client navigation currently fails on protected admin routes; document navigation is intentional. */
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminUser } from "@/lib/admin-auth";
import { safeAdminReturnPath } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = safeAdminReturnPath(Array.isArray(params.return_to) ? params.return_to[0] : params.return_to);
  if (await getAdminUser()) redirect(returnTo);

  return (
    <main className="admin-login-page" data-cms-ignore>
      <section className="admin-login-intro" aria-label="WedFotoBook">
        <a className="admin-login-brand" href="/">
          <span>W</span>
          <div><strong>WedFotoBook</strong><small>Панель управления</small></div>
        </a>
        <div>
          <span className="admin-kicker">Закрытый раздел</span>
          <h1>Управляйте сайтом спокойно и безопасно</h1>
          <p>Редактируйте тексты, просматривайте заявки и следите за аналитикой в одном месте.</p>
        </div>
        <small>Соединение защищено. Пароль не сохраняется в браузере сайтом.</small>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card">
          <span className="admin-kicker">Вход администратора</span>
          <h2>С&nbsp;возвращением</h2>
          <p>Введите пароль от панели.</p>
          <AdminLoginForm returnTo={returnTo} />
          <a className="admin-login-back" href="/">← Вернуться на сайт</a>
        </div>
      </section>
    </main>
  );
}
