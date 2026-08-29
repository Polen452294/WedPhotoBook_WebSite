import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const enquiries = sqliteTable(
  "enquiries",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: ["callback", "message"] }).notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    email: text("email"),
    message: text("message"),
    sourcePath: text("source_path").notNull(),
    status: text("status", { enum: ["new", "processed"] }).notNull().default("new"),
    notificationStatus: text("notification_status", {
      enum: ["pending", "sent", "failed", "not_configured"],
    }).notNull().default("pending"),
    notificationError: text("notification_error"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("enquiries_created_at_idx").on(table.createdAt),
    index("enquiries_status_idx").on(table.status),
  ],
);

export const submissionAttempts = sqliteTable(
  "submission_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientHash: text("client_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("submission_attempts_client_time_idx").on(table.clientHash, table.createdAt)],
);

export const siteContent = sqliteTable(
  "site_content",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pagePath: text("page_path").notNull(),
    nodeKey: text("node_key").notNull(),
    value: text("value").notNull(),
    originalValue: text("original_value").notNull(),
    updatedBy: text("updated_by").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("site_content_page_node_idx").on(table.pagePath, table.nodeKey),
    index("site_content_updated_at_idx").on(table.updatedAt),
  ],
);

export const siteCodeSettings = sqliteTable("site_code_settings", {
  key: text("key").primaryKey(),
  customCss: text("custom_css").notNull().default(""),
  revision: integer("revision").notNull().default(0),
  updatedBy: text("updated_by").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type", { enum: ["page_view", "click"] }).notNull(),
    pagePath: text("page_path").notNull(),
    sessionId: text("session_id").notNull(),
    label: text("label"),
    target: text("target"),
    referrer: text("referrer"),
    device: text("device", { enum: ["desktop", "tablet", "mobile"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("analytics_events_created_at_idx").on(table.createdAt),
    index("analytics_events_type_time_idx").on(table.eventType, table.createdAt),
    index("analytics_events_page_time_idx").on(table.pagePath, table.createdAt),
    index("analytics_events_session_time_idx").on(table.sessionId, table.createdAt),
  ],
);

export const adminActionAttempts = sqliteTable(
  "admin_action_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorUserId: text("actor_user_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("admin_action_attempts_actor_time_idx").on(table.actorUserId, table.createdAt)],
);

export const adminLoginAttempts = sqliteTable(
  "admin_login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientHash: text("client_hash").notNull(),
    succeeded: integer("succeeded", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("admin_login_attempts_client_time_idx").on(table.clientHash, table.createdAt),
    index("admin_login_attempts_success_time_idx").on(table.succeeded, table.createdAt),
  ],
);

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    actorEmail: text("actor_email").notNull(),
    action: text("action", { enum: ["content_update", "content_reset", "code_update", "code_reset"] }).notNull(),
    pagePath: text("page_path").notNull(),
    nodeKey: text("node_key").notNull(),
    previousValueHash: text("previous_value_hash"),
    nextValueHash: text("next_value_hash"),
    clientHash: text("client_hash"),
    requestId: text("request_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("admin_audit_log_created_at_idx").on(table.createdAt),
    index("admin_audit_log_actor_time_idx").on(table.actorUserId, table.createdAt),
  ],
);
