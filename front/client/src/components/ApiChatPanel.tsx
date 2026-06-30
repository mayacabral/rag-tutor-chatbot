import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { askQuestion } from "@/lib/apiClient";

interface MessageItem {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ arquivo?: string; pagina?: number }>;
}

export function ApiChatPanel() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error("Digite uma pergunta");
      return;
    }

    const prompt = question.trim();
    setMessages((current) => [...current, { role: "user", content: prompt }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await askQuestion(prompt);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao consultar a API");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-4 bg-slate-950 p-4">
      <Card className="flex flex-1 flex-col border-slate-700 bg-slate-900/70 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">Chat com a base</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <ScrollArea className="flex-1 rounded-lg border border-slate-700 bg-slate-950/70 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center text-slate-400">
                  <Sparkles className="mb-3 h-8 w-8 opacity-70" />
                  <p>Faça perguntas sobre o conteúdo.</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-4 py-3 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"}`}>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 border-t border-slate-700 pt-2 text-xs text-slate-400">
                        <p className="font-medium">Fontes:</p>
                        {message.sources.map((source, sourceIndex) => (
                          <p key={`${source.arquivo ?? "fonte"}-${sourceIndex}`}>
                            {source.arquivo ? `${source.arquivo}` : "Fonte"}
                            {source.pagina ? ` (pág. ${source.pagina})` : ""}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-slate-800 px-4 py-3 text-slate-200">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Digite sua pergunta"
              className="min-h-[90px] resize-none border-slate-700 bg-slate-950/70 text-slate-100"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleAsk();
                }
              }}
            />
            <Button onClick={() => void handleAsk()} disabled={isLoading || !question.trim()} className="h-[90px] w-[48px] bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
