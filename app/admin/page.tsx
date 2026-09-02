import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
/* eslint-disable @next/next/no-html-link-for-pages -- admin transitions require full authenticated document requests */
import { AdminShell } from "@/components/AdminShell";
import { getDb } from "@/db";
import { analyticsEvents, enquiries, siteContent } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function number(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function changeLabel(current: number, previous: number): { text: string; tone: "up" | "down" | "flat" } {
  if (!previous) return { text: current ? "Новые данные" : "Без изменений", tone: current ? "up" : "flat" };
  const change = Math.round(((current - previous) / previous) * 100);
  if (!change) return { text: "Без изменений", tone: "flat" };
  return { text: `${change > 0 ? "+" : ""}${change}% к прошлым 30 дням`, tone: change > 0 ? "up" : "down" };
}

function formatPath(path: string): string {
  return path === "/" ? "Главная" : path.replace(/^\//, "").replace(/\/$/, "").replaceAll("-", " ");
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).format(value);
}

export default async function AdminDashboardPage() {
  const user = await requireAdminUser("/admin/");
  const db = await getDb();
  const now = new Date();
  const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const chartStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const day = sql<string>`strftime('%Y-%m-%d', ${analyticsEvents.createdAt} / 1000, 'unixepoch')`;

  const [
    currentViewsRows,
    previousViewsRows,
    currentSessionsRows,
    previousSessionsRows,
    currentClicksRows,
    previousClicksRows,
    currentEnquiriesRows,
    previousEnquiriesRows,
    dailyRows,
    topPages,
    topClicks,
    deviceRows,
    recentEdits,
  ] = await Promise.all([
    db.select({ total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, currentStart))),
    db.select({ total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, previousStart), lt(analyticsEvents.createdAt, currentStart))),
    db.select({ total: sql<number>`count(distinct ${analyticsEvents.sessionId})` }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, currentStart))),
    db.select({ total: sql<number>`count(distinct ${analyticsEvents.sessionId})` }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, previousStart), lt(analyticsEvents.createdAt, currentStart))),
    db.select({ total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "click"), gte(analyticsEvents.createdAt, currentStart))),
    db.select({ total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "click"), gte(analyticsEvents.createdAt, previousStart), lt(analyticsEvents.createdAt, currentStart))),
    db.select({ total: count() }).from(enquiries).where(gte(enquiries.createdAt, currentStart)),
    db.select({ total: count() }).from(enquiries).where(and(gte(enquiries.createdAt, previousStart), lt(enquiries.createdAt, currentStart))),
    db.select({ day, total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, chartStart))).groupBy(day).orderBy(day),
    db.select({ pagePath: analyticsEvents.pagePath, total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, currentStart))).groupBy(analyticsEvents.pagePath).orderBy(desc(count())).limit(6),
    db.select({ label: analyticsEvents.label, total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "click"), gte(analyticsEvents.createdAt, currentStart))).groupBy(analyticsEvents.label).orderBy(desc(count())).limit(5),
    db.select({ device: analyticsEvents.device, total: count() }).from(analyticsEvents).where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, currentStart))).groupBy(analyticsEvents.device).orderBy(desc(count())),
    db.select().from(siteContent).orderBy(desc(siteContent.updatedAt)).limit(5),
  ]);

  const currentViews = number(currentViewsRows[0]?.total);
  const previousViews = number(previousViewsRows[0]?.total);
  const currentSessions = number(currentSessionsRows[0]?.total);
  const previousSessions = number(previousSessionsRows[0]?.total);
  const currentClicks = number(currentClicksRows[0]?.total);
  const previousClicks = number(previousClicksRows[0]?.total);
  const currentEnquiries = number(currentEnquiriesRows[0]?.total);
  const previousEnquiries = number(previousEnquiriesRows[0]?.total);
  const metrics = [
    { label: "Просмотры", value: currentViews, ...changeLabel(currentViews, previousViews) },
    { label: "Посетители", value: currentSessions, ...changeLabel(currentSessions, previousSessions) },
    { label: "Клики", value: currentClicks, ...changeLabel(currentClicks, previousClicks) },
    { label: "Заявки", value: currentEnquiries, ...changeLabel(currentEnquiries, previousEnquiries) },
  ];

  const dailyMap = new Map(dailyRows.map((row) => [row.day, number(row.total)]));
  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(chartStart.getTime() + index * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return { key, label: new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date), total: dailyMap.get(key) ?? 0 };
  });
  const maxDaily = Math.max(...daily.map((item) => item.total), 1);
  const maxPage = Math.max(...topPages.map((item) => number(item.total)), 1);
  const totalDevices = deviceRows.reduce((sum, item) => sum + number(item.total), 0) || 1;
  const deviceLabels: Record<string, string> = { desktop: "Компьютеры", tablet: "Планшеты", mobile: "Телефоны" };

  return (
    <AdminShell user={user}><main className="admin-page">
      <header className="admin-page-heading"><div><span className="admin-kicker">Сводка за 30 дней</span><h1>Всё важное — на одном экране</h1><p>Посещаемость, действия посетителей и свежие изменения контента.</p></div><a className="admin-primary-link" href="/admin/content/">Редактировать тексты</a></header>

      <section className="admin-metrics" aria-label="Основные показатели">
        {metrics.map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value.toLocaleString("ru-RU")}</strong><small className={`admin-trend ${metric.tone}`}>{metric.text}</small></article>)}
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-card admin-chart-card"><header><div><span className="admin-kicker">Динамика</span><h2>Просмотры за 14 дней</h2></div><strong>{currentViews ? `${((currentEnquiries / currentViews) * 100).toFixed(1)}%` : "0%"}<small>конверсия в заявку</small></strong></header><div className="admin-bar-chart" role="img" aria-label="График просмотров по дням">{daily.map((item) => <div key={item.key} className="admin-bar-column"><span>{item.total || ""}</span><i style={{ height: `${Math.max((item.total / maxDaily) * 100, item.total ? 8 : 2)}%` }} /><small>{item.label}</small></div>)}</div></section>

        <section className="admin-card"><header><div><span className="admin-kicker">Страницы</span><h2>Самые посещаемые</h2></div></header><div className="admin-ranked-list">{topPages.map((item, index) => <div key={item.pagePath}><span>{index + 1}</span><p><strong>{formatPath(item.pagePath)}</strong><i><b style={{ width: `${(number(item.total) / maxPage) * 100}%` }} /></i></p><em>{number(item.total)}</em></div>)}{!topPages.length && <p className="admin-empty-state">Данные появятся после первых согласившихся посетителей.</p>}</div></section>

        <section className="admin-card"><header><div><span className="admin-kicker">Интерес</span><h2>Частые клики</h2></div></header><div className="admin-simple-list">{topClicks.map((item) => <div key={item.label ?? "Без подписи"}><span>{item.label || "Без подписи"}</span><strong>{number(item.total)}</strong></div>)}{!topClicks.length && <p className="admin-empty-state">Пока нет кликов за выбранный период.</p>}</div></section>

        <section className="admin-card"><header><div><span className="admin-kicker">Устройства</span><h2>Как открывают сайт</h2></div></header><div className="admin-device-list">{deviceRows.map((item) => { const share = Math.round((number(item.total) / totalDevices) * 100); return <div key={item.device}><p><span>{deviceLabels[item.device] ?? item.device}</span><strong>{share}%</strong></p><i><b style={{ width: `${share}%` }} /></i></div>; })}{!deviceRows.length && <p className="admin-empty-state">Статистика устройств ещё собирается.</p>}</div></section>

        <section className="admin-card admin-recent-edits"><header><div><span className="admin-kicker">Контент</span><h2>Последние изменения</h2></div><a href="/admin/content/">Все тексты</a></header><div className="admin-simple-list">{recentEdits.map((item) => <div key={item.id}><p><strong>{formatPath(item.pagePath)}</strong><span>{item.value || "Текст скрыт"}</span></p><small>{formatDate(item.updatedAt)}</small></div>)}{!recentEdits.length && <p className="admin-empty-state">Изменений пока нет. Исходные тексты сайта сохранены.</p>}</div></section>
      </div>
    </main></AdminShell>
  );
}
