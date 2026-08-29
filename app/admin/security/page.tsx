import { desc } from "drizzle-orm";
import { AdminShell } from "@/components/AdminShell";
import { getDb } from "@/db";
import { adminAuditLog } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(value);
}

function formatAction(action: string): string {
  if (action === "content_reset") return "Возврат исходного текста";
  if (action === "code_update") return "Публикация CSS";
  if (action === "code_reset") return "Сброс CSS";
  return "Изменение текста";
}

export default async function AdminSecurityPage() {
  const user = await requireAdminUser("/admin/security/");
  const db = await getDb();
  const recentActions = await db.select({
    id: adminAuditLog.id,
    actorEmail: adminAuditLog.actorEmail,
    action: adminAuditLog.action,
    pagePath: adminAuditLog.pagePath,
    requestId: adminAuditLog.requestId,
    createdAt: adminAuditLog.createdAt,
  }).from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(100);

  const checks = [
    { title: "Доступ", text: "Отдельная страница входа, один пароль и подписанная сервером сессия сроком до 12 часов.", status: "Включено" },
    { title: "Защита изменений", text: "Запросы принимаются только с этого сайта, проверяются по типу, размеру и разрешённому маршруту.", status: "Включено" },
    { title: "Ограничение частоты", text: "До 5 неверных входов за 15 минут с одного адреса и не более 30 административных изменений в минуту.", status: "Включено" },
    { title: "Журнал действий", text: "Хранятся хеши версий текстов и CSS, а не их содержимое и не исходные IP-адреса. Срок хранения — 180 дней.", status: "Включено" },
  ];

  return (
    <AdminShell user={user}><main className="admin-page admin-security-page">
      <header className="admin-page-heading">
        <div>
          <span className="admin-kicker">Контроль доступа</span>
          <h1>Безопасность панели</h1>
          <p>Текущая учётная запись: {user.displayName}. Логин не используется, а секреты хранятся только на сервере.</p>
        </div>
      </header>

      <section className="admin-security-grid" aria-label="Состояние защиты">
        {checks.map((check) => (
          <article className="admin-card" key={check.title}>
            <div className="admin-security-status"><i aria-hidden="true" />{check.status}</div>
            <h2>{check.title}</h2>
            <p>{check.text}</p>
          </article>
        ))}
      </section>

      <section className="admin-card admin-audit-card">
        <header>
          <div><span className="admin-kicker">Последние 100 событий</span><h2>Журнал изменений</h2></div>
        </header>
        <div className="admin-audit-table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Действие</th><th>Страница</th><th>Администратор</th><th>Запрос</th></tr></thead>
            <tbody>
              {recentActions.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.createdAt)}</td>
                  <td>{formatAction(event.action)}</td>
                  <td><code>{event.pagePath}</code></td>
                  <td>Администратор</td>
                  <td><code>{event.requestId.slice(0, 20)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recentActions.length && <p className="admin-empty-state">Записей пока нет. Первое изменение текста или CSS появится здесь автоматически.</p>}
        </div>
      </section>
    </main></AdminShell>
  );
}
