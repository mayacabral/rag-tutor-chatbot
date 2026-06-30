import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ CONVERSATION PROCEDURES ============
  conversation: router({
    create: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.createConversation(ctx.user.id, input.title);
        return conversation;
      }),

    clear: protectedProcedure
      .input(z.object({ conversationId: z.number().optional(), title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (input.conversationId !== undefined) {
          await db.deleteConversation(input.conversationId);
        }

        const conversation = await db.createConversation(ctx.user.id, input.title);
        return conversation;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const conversations = await db.getConversationsByUserId(ctx.user.id);
        return conversations;
      }),

    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const conversation = await db.getConversationById(input.conversationId);
        return conversation;
      }),

    updateTitle: protectedProcedure
      .input(z.object({ conversationId: z.number(), title: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateConversationTitle(input.conversationId, input.title);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteConversation(input.conversationId);
        return { success: true };
      }),
  }),

  // ============ MESSAGE PROCEDURES ============
  message: router({
    getByConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const messages = await db.getMessagesByConversationId(input.conversationId);
        return messages;
      }),

    send: protectedProcedure
      .input(z.object({ 
        conversationId: z.number(), 
        content: z.string(),
        ragContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        const userMessage = await db.createMessage(input.conversationId, "user", input.content);

        // Generate AI response using LLM
        try {
          const systemPrompt = input.ragContext 
            ? `Você é um tutor inteligente. Use o seguinte contexto para responder:\n\n${input.ragContext}`
            : "Você é um tutor inteligente e prestativo.";

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.content },
            ],
          });

          const assistantContent = typeof response.choices[0]?.message.content === 'string' 
            ? response.choices[0].message.content 
            : "Desculpe, não consegui gerar uma resposta.";
          const assistantMessage = await db.createMessage(input.conversationId, "assistant", assistantContent);

          return {
            userMessage,
            assistantMessage,
          };
        } catch (error) {
          console.error("[LLM] Error generating response:", error);
          const errorMessage = await db.createMessage(
            input.conversationId,
            "assistant",
            "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente."
          );
          return {
            userMessage,
            assistantMessage: errorMessage,
            error: true,
          };
        }
      }),
  }),

  // ============ DOCUMENT PROCEDURES (ADMIN ONLY) ============
  document: router({
    list: adminProcedure
      .query(async () => {
        const documents = await db.getAllDocuments();
        return documents;
      }),

    upload: adminProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.enum(["pdf", "docx", "txt"]),
        fileData: z.instanceof(Buffer),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Upload file to storage
          const storageKey = `rag-documents/${ctx.user.id}/${Date.now()}-${input.fileName}`;
          const { key, url } = await storagePut(storageKey, input.fileData, "application/octet-stream");

          // Create document record
          const document = await db.createDocument(
            ctx.user.id,
            input.fileName,
            input.fileType,
            input.fileData.length,
            key
          );

          return {
            success: true,
            document,
            storageUrl: url,
          };
        } catch (error) {
          console.error("[Document Upload] Error:", error);
          throw new Error("Falha ao fazer upload do documento");
        }
      }),

    delete: adminProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.documentId);
        return { success: true };
      }),

    updateStatus: adminProcedure
      .input(z.object({
        documentId: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed"]),
        chunkCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDocumentStatus(input.documentId, input.status, input.chunkCount);
        return { success: true };
      }),
  }),

  // ============ RAG STATISTICS PROCEDURES (ADMIN ONLY) ============
  ragStats: router({
    get: adminProcedure
      .query(async () => {
        const stats = await db.getRagStatistics();
        return stats || {
          id: 0,
          totalDocuments: 0,
          totalChunks: 0,
          totalMessages: 0,
          totalUsers: 0,
          apiStatus: "operational",
          lastUpdated: new Date(),
        };
      }),

    update: adminProcedure
      .input(z.object({
        totalDocuments: z.number().optional(),
        totalChunks: z.number().optional(),
        totalMessages: z.number().optional(),
        totalUsers: z.number().optional(),
        apiStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateRagStatistics(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
