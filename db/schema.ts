import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
