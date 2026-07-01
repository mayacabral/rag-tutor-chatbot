# ==========================================
# Tutor de Turma — API RAG (FastAPI + LangChain)
# ==========================================
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala as dependências primeiro (aproveita o cache de camadas do Docker)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código da API
COPY rag.py ./

EXPOSE 8000

# HUGGINGFACEHUB_API_TOKEN, MONGODB_URI e (opcional) REVISOR_MODELO
# são passados por variável de ambiente em tempo de execução — NUNCA embutidos na imagem.
CMD ["uvicorn", "rag:app", "--host", "0.0.0.0", "--port", "8000"]
