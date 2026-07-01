import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Database, Cpu, FileStack, Boxes, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getStats } from "@/lib/apiClient";

export function RightPanel() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["rag-stats"],
    queryFn: getStats,
    refetchInterval: 15000,
  });

  const operational = !isError && !!stats;

  const StatItem = ({ icon: Icon, label, value, unit = "" }: { icon: any; label: string; value: string | number; unit?: string }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="font-semibold text-white">
        {value}
        {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
      </span>
    </div>
  );

  return (
    <aside className="w-80 border-l border-slate-700 bg-slate-900/50 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Arquitetura RAG</h2>
            <p className="text-xs text-slate-400">Informações do sistema</p>
          </div>

          {/* Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Status da API
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-6 bg-slate-700" />
              ) : (
                <Badge
                  variant={operational ? "default" : "secondary"}
                  className={
                    operational
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }
                >
                  {operational ? "Operacional" : "Indisponível"}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 bg-slate-700" />
                  ))}
                </>
              ) : (
                <>
                  <StatItem icon={FileStack} label="Documentos" value={stats?.documentos ?? 0} />
                  <StatItem icon={Boxes} label="Chunks" value={stats?.chunks ?? 0} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Model Information */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-5 bg-slate-700" />
                  ))}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400">Modelo LLM da saída</span>
                    <span className="text-white font-medium break-words">{stats?.modelo_saida ?? "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400">Modelo LLM da resposta</span>
                    <span className="text-white font-medium break-words">{stats?.modelo_resposta ?? "—"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400">Embedder</span>
                    <span className="text-white font-medium break-words">{stats?.embedder ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Banco Vetorial</span>
                    <span className="text-white font-medium text-right">{stats?.banco_vetorial ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Dimensão</span>
                    <span className="text-white font-medium">{stats?.dimensao ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Estratégia RAG</span>
                    <span className="text-white font-medium">{stats?.estrategia ?? "—"}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Versão:</span>
                <span className="text-white font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Índice:</span>
                <span className="text-white font-medium truncate">{stats?.indice ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  );
}
