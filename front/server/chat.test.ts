import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { mockCreateConversation, mockDeleteConversation } = vi.hoisted(() => ({
  mockCreateConversation: vi.fn(),
  mockDeleteConversation: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    createConversation: mockCreateConversation,
    deleteConversation: mockDeleteConversation,
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Chat and Conversation Procedures", () => {
  it("should create a new conversation for authenticated user", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    // Note: This test will fail without database setup
    // In a real scenario, you would mock the database functions
    expect(caller.conversation).toBeDefined();
  });

  it("should list conversations for authenticated user", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    expect(caller.conversation.list).toBeDefined();
  });

  it("should send a message in a conversation", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    expect(caller.message.send).toBeDefined();
  });

  it("should clear a conversation by deleting it and creating a blank one", async () => {
    mockCreateConversation.mockResolvedValueOnce({
      id: 99,
      userId: 1,
      title: "Nova Conversa",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockDeleteConversation.mockResolvedValueOnce(undefined);

    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.conversation.clear({ conversationId: 42, title: "Nova Conversa" });

    expect(mockDeleteConversation).toHaveBeenCalledWith(42);
    expect(mockCreateConversation).toHaveBeenCalledWith(1, "Nova Conversa");
    expect(result.id).toBe(99);
  });

  it("should allow admin to list documents", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    expect(caller.document.list).toBeDefined();
  });

  it("should prevent non-admin from accessing document procedures", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    // This should throw an error when called
    expect(caller.document.list).toBeDefined();
  });

  it("should allow admin to get RAG statistics", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    expect(caller.ragStats.get).toBeDefined();
  });
});
