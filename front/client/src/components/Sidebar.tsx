import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDocument, listDocuments, uploadDocuments } from "@/lib/apiClient";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Lista os documentos que a API Python (RAG) realmente tem indexados no MongoDB.
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rag-documents"],
    queryFn: listDocuments,
  });
  const documents = data?.documentos ?? [];

  const uploadMutation = useMutation({
    mutationFn: () => uploadDocuments(selectedFile ? [selectedFile] : []),
    onSuccess: (result) => {
      toast.success(`Documento indexado (${result.chunks} chunk(s) na base)`);
      setSelectedFile(null);
      setOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar documento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fonte: string) => deleteDocument(fonte),
    onSuccess: () => {
      toast.success("Documento removido da base");
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao remover documento");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(file.type)) {
        toast.error("Apenas PDF, DOCX e TXT são suportados");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 50MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate();
  };

  return (
    <aside className="w-80 border-r border-slate-700 bg-slate-900/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3">Documentos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Enviar Novo Documento</DialogTitle>
              <DialogDescription className="text-slate-400">
                Suporte para PDF, DOCX e TXT (máximo 50MB)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file" className="text-slate-300">
                  Selecione um arquivo
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="mt-2 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              {selectedFile && (
                <div className="p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold">Arquivo selecionado:</span> {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {uploadMutation.isPending ? "Indexando..." : "Enviar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 bg-slate-700" />
              ))}
            </>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.fonte}
                className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-white truncate">{doc.fonte}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-green-400">Indexado</span>
                      {doc.chunks > 0 && <span>• {doc.chunks} chunks</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(doc.fonte)}
                    disabled={deleteMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Nenhum documento enviado</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </aside>
  );
}
