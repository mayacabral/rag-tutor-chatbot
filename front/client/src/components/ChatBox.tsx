import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

interface ChatBoxProps {
  conversationId: number;
}

export function ChatBox({ conversationId }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveConversationId(conversationId);
  }, [conversationId]);

  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = trpc.message.getByConversation.useQuery(
    {
      conversationId: activeConversationId ?? 0,
    },
    {
      enabled: Boolean(activeConversationId),
    }
  );

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setInput("");
      setIsLoading(false);
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
      setIsLoading(false);
    },
  });

  const clearConversationMutation = trpc.conversation.clear.useMutation({
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id);
      setInput("");
      setIsLoading(false);
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar a conversa");
      setIsLoading(false);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversationId) return;

    setIsLoading(true);
    sendMutation.mutate({
      conversationId: activeConversationId,
      content: input.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (!activeConversationId) return;

    if (confirm("Tem certeza que deseja limpar toda a conversa?")) {
      setIsLoading(true);
      clearConversationMutation.mutate({
        conversationId: activeConversationId,
        title: "Nova Conversa",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messagesLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-3/4 bg-slate-800" />
                  <Skeleton className="h-12 w-2/3 bg-slate-800 ml-auto" />
                </div>
              ))}
            </>
          ) : messages && messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in-50 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-2xl px-4 py-3 rounded-lg",
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Streamdown className="text-sm leading-relaxed">
                      {message.content}
                    </Streamdown>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">RAG</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Bem-vindo ao RAG Tutor</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Faça uma pergunta sobre o conteúdo dos documentos indexados e receba respostas contextualizadas pela IA.
              </p>
            </div>
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-in fade-in-50 duration-300">
              <div className="bg-slate-800 text-slate-100 border border-slate-700 px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleClearChat}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Pressione Enter para enviar ou Shift+Enter para quebra de linha
          </p>
        </div>
      </div>
    </div>
  );
}
