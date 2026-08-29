import { desc } from "drizzle-orm";
import { AdminShell } from "@/components/AdminShell";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(value);
}

export default async function EnquiriesAdminPage() {
  const user = await requireAdminUser("/admin/zayavki/");

  const db = await getDb();
  const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(200);

  return (
    <AdminShell user={user}><main className="admin-page admin-enquiries">
      <header className="admin-page-heading">
        <div><span className="admin-kicker">Обращения клиентов</span><h1>Заявки с сайта</h1><p>Последние 200 обращений. Все даты указаны по Москве.</p></div>
      </header>
      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>Дата</th><th>Тип</th><th>Клиент</th><th>Контакты</th><th>Сообщение</th><th>Страница</th><th>Уведомление</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.kind === "callback" ? "Звонок" : "Сообщение"}</td>
                <td><strong>{row.name}</strong><small>{row.id}</small></td>
                <td>{row.phone && <a href={`tel:${row.phone}`}>{row.phone}</a>}{row.email && <a href={`mailto:${row.email}`}>{row.email}</a>}</td>
                <td>{row.message || "—"}</td>
                <td>{row.sourcePath}</td>
                <td>{row.notificationStatus === "sent" ? "Отправлено" : row.notificationStatus === "failed" ? "Ошибка почты" : row.notificationStatus === "not_configured" ? "Почта не настроена" : "Ожидает"}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="admin-empty">Заявок пока нет.</td></tr>}
          </tbody>
        </table>
      </div>
    </main></AdminShell>
  );
}
