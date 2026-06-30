import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Chat conversations table - stores individual conversations per user
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default("Nova Conversa"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Chat messages table - stores individual messages within conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Documents table - stores metadata about uploaded documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // pdf, docx, txt
  fileSize: int("fileSize").notNull(), // in bytes
  storageKey: varchar("storageKey", { length: 255 }).notNull(), // S3 key
  indexingStatus: mysqlEnum("indexingStatus", ["pending", "processing", "completed", "failed"]).default("pending"),
  chunkCount: int("chunkCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * RAG System Statistics table - stores aggregated system metrics
 */
export const ragStatistics = mysqlTable("ragStatistics", {
  id: int("id").autoincrement().primaryKey(),
  totalDocuments: int("totalDocuments").default(0),
  totalChunks: int("totalChunks").default(0),
  totalMessages: int("totalMessages").default(0),
  totalUsers: int("totalUsers").default(0),
  apiStatus: varchar("apiStatus", { length: 50 }).default("operational"), // operational, degraded, down
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type RagStatistics = typeof ragStatistics.$inferSelect;
export type InsertRagStatistics = typeof ragStatistics.$inferInsert;