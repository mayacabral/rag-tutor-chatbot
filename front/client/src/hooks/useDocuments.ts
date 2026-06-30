import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useDocuments() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents, isLoading, refetch } = trpc.document.list.useQuery();
  const uploadMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado com sucesso");
      setSelectedFile(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar documento");
    },
  });

  const deleteMutation = trpc.document.delete.useMutation({
    onSuccess: () => {
      toast.success("Documento removido com sucesso");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao remover documento");
    },
  });

  const updateStatusMutation = trpc.document.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleFileSelect = (file: File) => {
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
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const fileType = selectedFile.type === "application/pdf" ? "pdf" : selectedFile.type.includes("word") ? "docx" : "txt";
    const buffer = await selectedFile.arrayBuffer();

    uploadMutation.mutate({
      fileName: selectedFile.name,
      fileType: fileType as "pdf" | "docx" | "txt",
      fileData: Buffer.from(buffer),
    });
  };

  return {
    documents,
    selectedFile,
    isLoading,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleFileSelect,
    handleUpload,
    deleteDocument: deleteMutation.mutate,
    updateDocumentStatus: updateStatusMutation.mutate,
    refetch,
  };
}
