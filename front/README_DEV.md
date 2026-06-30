# RAG Tutor System - Guia de Desenvolvimento

## Visão Geral do Projeto

O RAG Tutor System é um sistema web completo para tutoria inteligente baseado em Retrieval-Augmented Generation (RAG). O projeto utiliza React 19, Express, tRPC, Tailwind CSS e integração com LLM para fornecer um chat inteligente com suporte a múltiplos usuários e papéis.

## Arquitetura

### Stack Tecnológico

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui (componentes)
- Wouter (roteamento)
- tRPC (comunicação com backend)
- Streamdown (renderização de Markdown)

**Backend:**
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB
- OAuth Manus (autenticação)

**Integrações:**
- LLM (Claude, GPT, etc.)
- S3 Storage (upload de documentos)
- Manus OAuth

## Estrutura de Pastas

```
rag-tutor-system/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas (Login, Dashboard)
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── hooks/            # Hooks customizados
│   │   ├── contexts/         # Contextos React
│   │   ├── lib/              # Utilitários
│   │   ├── App.tsx           # Roteamento principal
│   │   └── main.tsx          # Entry point
│   ├── public/               # Arquivos estáticos
│   └── index.html            # Template HTML
├── server/                   # Backend Express
│   ├── routers.ts            # Procedures tRPC
│   ├── db.ts                 # Queries de banco de dados
│   ├── storage.ts            # Upload de arquivos
│   └── _core/                # Configuração interna
├── drizzle/                  # Schema e migrations
│   ├── schema.ts             # Definição de tabelas
│   └── migrations/           # Arquivos SQL
├── shared/                   # Código compartilhado
├── references/               # Documentação de integrações
└── package.json              # Dependências
```

## Banco de Dados

### Tabelas Principais

**users**
- Armazena informações de usuários
- Campos: id, openId, name, email, role, createdAt, updatedAt, lastSignedIn

**conversations**
- Histórico de conversas por usuário
- Campos: id, userId, title, createdAt, updatedAt

**messages**
- Mensagens individuais dentro de conversas
- Campos: id, conversationId, role (user/assistant), content, createdAt

**documents**
- Metadados de documentos enviados
- Campos: id, uploadedBy, fileName, fileType, fileSize, storageKey, indexingStatus, chunkCount, createdAt, updatedAt

**ragStatistics**
- Estatísticas agregadas do sistema
- Campos: id, totalDocuments, totalChunks, totalMessages, totalUsers, apiStatus, lastUpdated

## Procedures tRPC

### Autenticação
- `auth.me` - Retorna usuário atual
- `auth.logout` - Realiza logout

### Conversas
- `conversation.create` - Cria nova conversa
- `conversation.list` - Lista conversas do usuário
- `conversation.get` - Obtém conversa específica
- `conversation.updateTitle` - Atualiza título
- `conversation.delete` - Deleta conversa

### Mensagens
- `message.getByConversation` - Lista mensagens de uma conversa
- `message.send` - Envia mensagem e gera resposta da IA

### Documentos (Admin)
- `document.list` - Lista todos os documentos
- `document.upload` - Faz upload de novo documento
- `document.delete` - Deleta documento
- `document.updateStatus` - Atualiza status de indexação

### Estatísticas (Admin)
- `ragStats.get` - Obtém estatísticas do sistema
- `ragStats.update` - Atualiza estatísticas

## Fluxo de Desenvolvimento

### 1. Adicionar Nova Funcionalidade

**Passo 1: Atualizar Schema**
```bash
# Editar drizzle/schema.ts
pnpm drizzle-kit generate
# Revisar SQL gerado em drizzle/migrations/
```

**Passo 2: Aplicar Migration**
```bash
# Usar webdev_execute_sql para aplicar
```

**Passo 3: Adicionar Query Helper**
```typescript
// Em server/db.ts
export async function myNewQuery() {
  const db = await getDb();
  // implementar
}
```

**Passo 4: Criar Procedure tRPC**
```typescript
// Em server/routers.ts
myFeature: router({
  myProcedure: protectedProcedure
    .input(z.object({ /* schema */ }))
    .query/mutation(async ({ ctx, input }) => {
      // implementar
    })
})
```

**Passo 5: Consumir no Frontend**
```typescript
// Em componentes React
const { data } = trpc.myFeature.myProcedure.useQuery(input);
```

### 2. Testar Localmente

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Verificar tipos
pnpm check
```

### 3. Fazer Build

```bash
pnpm build
```

## Componentes Principais

### RagLayout
Layout responsivo que muda conforme o papel do usuário:
- Admin: 3 colunas (sidebar, chat, painel direito)
- User: coluna central (chat)

### ChatBox
Componente principal de chat com:
- Histórico de mensagens
- Renderização de Markdown
- Indicador de digitação
- Scroll automático

### Sidebar
Gerenciamento de documentos (admin):
- Upload com validação
- Listagem com status
- Remoção de documentos

### RightPanel
Informações do sistema (admin):
- Estatísticas
- Configuração do RAG
- Status da API

## Integração com LLM

As respostas são geradas usando a API LLM integrada:

```typescript
import { invokeLLM } from "./server/_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: "Você é um tutor..." },
    { role: "user", content: "Pergunta do usuário" },
  ],
});
```

## Upload de Documentos

Documentos são armazenados em S3 via:

```typescript
import { storagePut } from "./server/storage";

const { key, url } = await storagePut(
  storageKey,
  fileBuffer,
  "application/pdf"
);
```

## Autenticação OAuth

A autenticação é gerenciada automaticamente pelo template:
- Login: Redireciona para portal OAuth Manus
- Callback: Salva sessão em cookie
- Logout: Limpa cookie de sessão

## Deployment

O projeto está pronto para deploy no Manus:

1. Criar checkpoint com `webdev_save_checkpoint`
2. Clicar em "Publish" no Management UI
3. Sistema será deployado automaticamente

## Variáveis de Ambiente

Variáveis injetadas automaticamente:
- `DATABASE_URL` - Conexão com banco de dados
- `JWT_SECRET` - Chave para sessão
- `VITE_APP_ID` - ID da aplicação OAuth
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `BUILT_IN_FORGE_API_URL` - URL da API LLM
- `BUILT_IN_FORGE_API_KEY` - Chave da API LLM

## Boas Práticas

1. **Sempre use protectedProcedure para dados sensíveis**
2. **Valide entrada com Zod**
3. **Trate erros apropriadamente**
4. **Use optimistic updates para melhor UX**
5. **Escreva testes para procedures críticos**
6. **Mantenha componentes pequenos e reutilizáveis**
7. **Use hooks customizados para lógica compartilhada**

## Troubleshooting

### TypeScript errors
```bash
pnpm check
```

### Build errors
```bash
pnpm build
```

### Database issues
Verificar `.manus-logs/devserver.log`

## Próximas Melhorias

- [ ] Streaming de respostas em tempo real
- [ ] Suporte a múltiplos idiomas
- [ ] Temas customizáveis
- [ ] Integração com APIs externas
- [ ] Analytics avançado
- [ ] Backup automático

---

**Versão**: 1.0.0  
**Última Atualização**: Junho 2026
