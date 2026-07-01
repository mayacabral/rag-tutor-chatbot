const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Erro na requisição para ${path}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function askQuestion(question: string) {
  return request<{ answer: string; sources: Array<{ arquivo?: string; pagina?: number }> }>('/perguntar', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

export interface RagDocument {
  fonte: string;
  chunks: number;
}

export async function listDocuments() {
  return request<{ documentos: RagDocument[] }>('/documentos');
}

export async function uploadDocuments(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/carregar-documentos`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "Erro ao enviar documento");
  }

  return payload as { message: string; files: string[]; chunks: number };
}

export interface RagStats {
  status: string;
  documentos: number;
  chunks: number;
  modelo_saida: string;
  modelo_resposta: string;
  embedder: string;
  banco_vetorial: string;
  dimensao: number;
  estrategia: string;
  indice: string;
}

export async function getStats() {
  return request<RagStats>('/estatisticas');
}

export async function deleteDocument(fonte: string) {
  const response = await fetch(`${API_BASE_URL}/documentos?fonte=${encodeURIComponent(fonte)}`, {
    method: "DELETE",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || "Erro ao remover documento");
  }

  return payload as { fonte: string; removidos: number };
}
