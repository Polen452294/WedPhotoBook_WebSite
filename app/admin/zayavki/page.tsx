import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";

export const dynamic = "force-dynamic";

function allowedAdminEmails(): Set<string> {
  const configured = process.env.ADMIN_EMAILS || process.env.CONTACT_TO_EMAIL || "79854342367@yandex.ru";
  return new Set(configured.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(value);
}

export default async function EnquiriesAdminPage() {
  const user = await requireChatGPTUser("/admin/zayavki/");
  if (!allowedAdminEmails().has(user.email.toLowerCase())) notFound();

  const db = await getDb();
  const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(200);

  return (
    <main className="admin-enquiries">
      <header>
        <div><span>WedFotoBook</span><h1>Заявки с сайта</h1></div>
        <p>Последние 200 обращений. Все даты указаны по Москве.</p>
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
    </main>
  );
}
