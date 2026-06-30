# RAG Tutor Chatbot

Chatbot de tutoria baseado em **RAG (Retrieval-Augmented Generation)**: você envia documentos (PDF, DOCX, TXT) e faz perguntas sobre o conteúdo deles. As respostas são geradas por um LLM usando apenas os trechos relevantes recuperados de uma base vetorial — com citação das fontes (arquivo e página).

## Arquitetura

```
front/  (React + Vite)                rag.py  (FastAPI)
  Dashboard ──fetch──►  API Python  ──►  Pipeline RAG  ──►  MongoDB Atlas (Vector Search)
  (Sidebar/Chat/Painel)                                └──►  HuggingFace (embeddings + LLM)
```

- **Backend (`rag.py`)** — API FastAPI com o pipeline RAG: leitura de documentos → chunking → embeddings → indexação/busca vetorial no MongoDB Atlas → geração de resposta com LLM.
- **Frontend (`front/`)** — interface React (Vite) com o dashboard (envio de documentos, chat e estatísticas). O servidor Express serve apenas o frontend; **todos os dados vêm da API Python**.

### Tecnologias

| Camada | Stack |
|--------|-------|
| API / RAG | Python, FastAPI, LangChain |
| Embeddings | HuggingFace Inference API — `sentence-transformers/all-MiniLM-L6-v2` (384 dims) |
| LLM | HuggingFace Endpoint — `Qwen/Qwen2.5-7B-Instruct` |
| Banco vetorial | MongoDB Atlas Vector Search |
| Frontend | React 19, Vite, TypeScript, Tailwind, shadcn/ui |

## Pré-requisitos

- **Python 3.13+**
- **Node.js 20+** e **pnpm** (`npm install -g pnpm`)
- Uma conta no **MongoDB Atlas** (com um cluster) e um **token da HuggingFace**

## 1. Configuração (`.env`)

Crie um arquivo **`.env`** na raiz do projeto (ele é ignorado pelo git — **nunca** comite suas credenciais):

```env
HUGGINGFACEHUB_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxx.mongodb.net/?appName=Cluster0
```

> No primeiro upload de documento, a API cria automaticamente o índice de Atlas Vector Search (`vector_index`) na coleção `chatbotia.documentos`.

## 2. Backend (API Python)

Na raiz do projeto:

```bash
# criar e ativar o ambiente virtual
python -m venv .venv
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# instalar dependências
pip install -r requirements.txt

# subir a API (porta 8000)
uvicorn rag:app --reload
```

> No Windows, há um atalho: `./setup.ps1` cria o `.venv` e instala tudo.

A API fica em **http://127.0.0.1:8000** — documentação interativa em **http://127.0.0.1:8000/docs**.

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/saude` | Health check |
| `POST` | `/carregar-documentos` | Envia e indexa documentos (PDF/DOCX/TXT) |
| `POST` | `/perguntar` | Faz uma pergunta (RAG) |
| `GET` | `/documentos` | Lista os documentos indexados |
| `DELETE` | `/documentos?fonte=<arquivo>` | Remove um documento |
| `GET` | `/estatisticas` | Estatísticas do RAG (documentos, chunks, config) |

## 3. Frontend

Em outra aba do terminal:

```bash
cd front
pnpm install
pnpm dev
```

O frontend sobe em **http://localhost:3000** e se conecta à API Python (configurável via `VITE_API_BASE_URL`, padrão `http://127.0.0.1:8000`).

> O frontend cria um `front/.env` local com `NODE_ENV=development`, `PORT=3000` e `VITE_API_BASE_URL`. A autenticação OAuth original (plataforma Manus) foi substituída por um login local mockado para rodar de forma autônoma.

## Como usar

1. Suba o **backend** e o **frontend** (passos 2 e 3).
2. No dashboard, use **"Enviar Documento"** (barra lateral) para indexar um arquivo.
3. Faça perguntas no **chat** — as respostas citam as fontes.
4. O **painel direito** mostra estatísticas reais (documentos, chunks, modelo, etc.).

## Estrutura do projeto

```
.
├── rag.py              # API FastAPI + pipeline RAG
├── requirements.txt    # dependências Python
├── setup.ps1           # setup do ambiente (Windows)
├── .env                # credenciais (NÃO versionado)
└── front/              # frontend React + Vite
    ├── client/src/     # componentes, páginas, hooks
    └── server/_core/   # servidor Express que serve o Vite
```

## Notas

- Há um documento de manutenção em [`front/PLANO_LIMPEZA.md`](front/PLANO_LIMPEZA.md) com o histórico da limpeza do código herdado da plataforma Manus.
- O índice em memória da API é por processo: ao reiniciar a API, reenvie/consulte os documentos para repopular o estado da sessão (os vetores permanecem no MongoDB).
