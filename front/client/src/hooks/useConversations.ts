import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export function useConversations() {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const { data: conversations, isLoading, refetch } = trpc.conversation.list.useQuery();
  const createMutation = trpc.conversation.create.useMutation({
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id);
      refetch();
    },
  });

  const deleteMutation = trpc.conversation.delete.useMutation({
    onSuccess: () => {
      if (activeConversationId === deleteMutation.variables?.conversationId) {
        setActiveConversationId(conversations?.[0]?.id || null);
      }
      refetch();
    },
  });

  // Set first conversation as active on load
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  return {
    activeConversationId,
    setActiveConversationId,
    conversations,
    isLoading,
    createConversation: createMutation.mutate,
    deleteConversation: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
