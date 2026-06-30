import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, documents, ragStatistics, Conversation, Message, Document, RagStatistics } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CONVERSATION QUERIES ============

export async function createConversation(userId: number, title?: string): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values({
    userId,
    title: title || "Nova Conversa",
  });

  const id = result[0].insertId as number;
  const conversation = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return conversation[0];
}

export async function getConversationsByUserId(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversationById(conversationId: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  return result[0];
}

export async function updateConversationTitle(conversationId: number, title: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(conversations).set({ title }).where(eq(conversations.id, conversationId));
}

export async function deleteConversation(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(conversations).where(eq(conversations.id, conversationId));
}

// ============ MESSAGE QUERIES ============

export async function createMessage(conversationId: number, role: "user" | "assistant", content: string): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values({
    conversationId,
    role,
    content,
  });

  const id = result[0].insertId as number;
  const message = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return message[0];
}

export async function getMessagesByConversationId(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ============ DOCUMENT QUERIES ============

export async function createDocument(uploadedBy: number, fileName: string, fileType: string, fileSize: number, storageKey: string): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values({
    uploadedBy,
    fileName,
    fileType,
    fileSize,
    storageKey,
  });

  const id = result[0].insertId as number;
  const document = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return document[0];
}

export async function getAllDocuments(): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function getDocumentById(documentId: number): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  return result[0];
}

export async function updateDocumentStatus(documentId: number, status: "pending" | "processing" | "completed" | "failed", chunkCount?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: Record<string, unknown> = { indexingStatus: status };
  if (chunkCount !== undefined) {
    updateData.chunkCount = chunkCount;
  }

  await db.update(documents).set(updateData).where(eq(documents.id, documentId));
}

export async function deleteDocument(documentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(documents).where(eq(documents.id, documentId));
}

// ============ RAG STATISTICS QUERIES ============

export async function getRagStatistics(): Promise<RagStatistics | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(ragStatistics).limit(1);
  return result[0];
}

export async function updateRagStatistics(stats: Partial<Omit<RagStatistics, 'id' | 'lastUpdated'>>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getRagStatistics();
  
  if (!existing) {
    // Create initial statistics
    await db.insert(ragStatistics).values({
      totalDocuments: stats.totalDocuments || 0,
      totalChunks: stats.totalChunks || 0,
      totalMessages: stats.totalMessages || 0,
      totalUsers: stats.totalUsers || 0,
      apiStatus: stats.apiStatus || "operational",
    });
  } else {
    // Update existing statistics
    await db.update(ragStatistics).set(stats).where(eq(ragStatistics.id, existing.id));
  }
}
