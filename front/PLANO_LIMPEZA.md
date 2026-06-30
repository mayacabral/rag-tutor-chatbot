# Plano de Limpeza — `/front`

> Levantamento de código não utilizado no frontend, para decidirmos **manter ou remover**.
> Documento de análise — **nada foi removido ainda**. Cada item traz confiança e trade-offs.

## Contexto: a "realidade" atual da arquitetura

O `front/` foi gerado pela plataforma **Manus** como um app completo (React + Express + tRPC + **MySQL/Drizzle** + **S3** + OAuth Manus + integrações de IA/voz/imagem/mapa).

Porém, na configuração que deixamos rodando localmente, o app ativo é **enxuto**:

```
main.tsx → App.tsx → Painel (Dashboard)
                       └─ RagLayout
                            ├─ Sidebar      → API Python (/documentos, /carregar-documentos)
                            ├─ ApiChatPanel → API Python (/perguntar)
                            └─ RightPanel   → API Python (/estatisticas)
                            └─ Header       → tRPC (apenas auth.logout)
```

Ou seja: **quase todo o backend tRPC/MySQL/S3 e várias integrações da Manus ficaram órfãos**. O que está vivo conversa com a **API Python (RAG)**.

## Metodologia

Rastreamento da árvore de imports a partir de `main.tsx`, com `grep` de referências em `client/`, `server/` e `shared/` (excluindo `node_modules`). Confiança:
- 🟢 **Alta** — zero referências em código vivo.
- 🟡 **Média** — referenciado só por código que também está morto (morte em cascata).
- 🔴 **Cuidado** — usado por algo vivo; remover exige refatorar.

---

## A. Componentes React não usados (`client/src/components`)

| Componente | Refs | Confiança | Observação |
|------------|------|-----------|------------|
| `AIChatBox.tsx` | 0 | 🟢 | Chat antigo via `trpc.ai.chat` (procedure que nem existe no router) |
| `ChatBox.tsx` | 0 | 🟢 | Chat via tRPC `message.*` (MySQL) |
| `DashboardLayout.tsx` | 0 | 🟢 | Layout alternativo não usado (usamos `RagLayout`) |
| `DashboardLayoutSkeleton.tsx` | 1 | 🟡 | Só usado por `DashboardLayout` (morto) |
| `ManusDialog.tsx` | 0 | 🟢 | Componente da Manus |
| `Map.tsx` | 0 | 🟢 | Google Maps; puxa `usePersistFn` |

**Vivos (manter):** `ApiChatPanel`, `Sidebar`, `Header`, `RightPanel`, `RagLayout`, `ErrorBoundary`.

## B. Hooks não usados (`client/src/hooks`)

| Hook | Confiança | Observação |
|------|-----------|------------|
| `useConversations.ts` | 🟢 | tRPC `conversation.*` (MySQL) |
| `useDocuments.ts` | 🟢 | tRPC `document.*` (S3/MySQL) — substituído pela API Python |
| `useComposition.ts` | 🟢 | Não referenciado |
| `usePersistFn.ts` | 🟡 | Só usado por `Map` e `useComposition` (ambos mortos) |
| `useMobile.tsx` (`useIsMobile`) | 🟡 | Usado por `DashboardLayout` (morto) e `ui/sidebar` (UI não usada) |

## C. Componentes UI shadcn não usados (`client/src/components/ui`)

Geramos **42** componentes na CLI, mas o app usa só **13**:

> **Usados:** `avatar, badge, button, card, dialog, dropdown-menu, input, label, scroll-area, skeleton, sonner, textarea, tooltip`

**25 sem nenhuma referência (🟢 seguros p/ remover):**
```
accordion      carousel       drawer        popover       slider
alert          checkbox       hover-card    progress      switch
aspect-ratio   collapsible    input-otp     radio-group   table
breadcrumb     command        menubar       resizable     tabs
calendar       context-menu   pagination    select        toggle-group
```
Outros ~4 (`sheet, separator, toggle, ...`) são usados **apenas internamente** por `ui/sidebar` (que o app não usa) → 🟡.

> 💡 Componentes shadcn são re-geráveis a qualquer momento com `pnpm dlx shadcn add <nome>`. Removê-los é de **baixo risco**.

## D. Módulos do servidor não usados (`server/_core`)

| Módulo | Refs | Confiança |
|--------|------|-----------|
| `dataApi.ts` | 0 | 🟢 |
| `heartbeat.ts` | 0 | 🟢 |
| `imageGeneration.ts` | 0 | 🟢 |
| `map.ts` | 0 | 🟢 |
| `voiceTranscription.ts` | 0 | 🟢 |

**Vivos (manter):** `context, cookies, env, oauth, vite, trpc, systemRouter, sdk, notification, llm, storageProxy`.

## E. Backend tRPC / MySQL / S3 — em grande parte órfão 🔴

O cliente só chama **`trpc.auth.logout`** (em `Header.tsx`). Todas as outras procedures estão **mortas do ponto de vista do app**:

| Router | Usado pelo app? | Depende de |
|--------|-----------------|------------|
| `auth` (`logout`) | ✅ Sim (Header) | — |
| `conversation` | ❌ | MySQL (`db.ts`) |
| `message` (`send`) | ❌ | MySQL + `_core/llm` |
| `document` | ❌ | MySQL + S3 (`storage.ts`) |
| `ragStats` | ❌ | MySQL |
| `system` | parcial | — |

Consequência: `server/db.ts` (Drizzle/MySQL), `server/storage.ts` (S3), `drizzle/` (schema/migrations) e `_core/llm.ts` só servem rotas mortas.

> ⚠️ **Decisão estratégica:** remover isso é o maior ganho de simplicidade, mas é **irreversível sem git** e assume que **nunca** vamos querer o backend próprio (histórico de conversas, multiusuário, etc.). É o ponto que mais precisa da sua decisão.

## F. Dependências candidatas a remover (`package.json`)

| Dependência | Uso real | Confiança |
|-------------|----------|-----------|
| `@aws-sdk/client-s3` + `s3-request-presigner` | 0 | 🟢 (some com S3/`storage.ts`) |
| `recharts` | 0 | 🟢 |
| `framer-motion` | 0 | 🟢 |
| `mysql2`, `drizzle-orm`, `drizzle-kit` | só `db.ts` (morto) | 🟡 (junto com E) |
| `embla-carousel-react` | só `ui/carousel` | 🟡 |
| `vaul` | só `ui/drawer` | 🟡 |
| `cmdk` | só `ui/command` | 🟡 |
| `input-otp` | só `ui/input-otp` | 🟡 |
| `react-day-picker` | só `ui/calendar` | 🟡 |
| `react-resizable-panels` | só `ui/resizable` | 🟡 |
| ~28 pacotes `@radix-ui/*` | vários só por UI não usada | 🟡 |

> Os 🟡 caem automaticamente ao remover os componentes UI/servidor correspondentes (C/E).

## G. Outros artefatos

| Item | Observação | Sugestão |
|------|------------|----------|
| `references/` | Docs de integrações Manus (voz, imagem, mapa, oauth…) | 🟢 remover se não for usar |
| `.manus-logs/` | Logs do plugin de debug da Manus | 🟢 limpável |
| `client/public/__manus__/` | Coletor de debug da Manus | 🟡 (ligado ao `vite.config`) |
| `attached_assets/` (alias `@assets`) | Não existe / vazio | — |

---

## Plano de execução sugerido (em fases, do mais seguro ao mais estratégico)

**Fase 1 — Lixo óbvio (🟢, risco baixo, reversível-ish):**
1. Remover componentes mortos: `AIChatBox, ChatBox, DashboardLayout, DashboardLayoutSkeleton, ManusDialog, Map`.
2. Remover hooks mortos: `useConversations, useDocuments, useComposition, usePersistFn, useMobile`.
3. Remover os 25 UI shadcn sem referência.
4. Remover módulos `_core` mortos: `dataApi, heartbeat, imageGeneration, map, voiceTranscription`.
5. `pnpm remove` de `@aws-sdk/*`, `recharts`, `framer-motion`.
6. Limpar `references/`, `.manus-logs/`.

**Fase 2 — Decisão estratégica (🔴, precisa do seu "sim"):**
7. Aposentar o backend tRPC/MySQL/S3: `conversation/message/document/ragStats` routers, `db.ts`, `storage.ts`, `drizzle/`, `_core/llm.ts`, e remover `mysql2/drizzle-*`.
   - **Pré-requisito:** decidir o que fazer com o **logout** (única rota tRPC viva) — pode virar um logout local simples, já que o auth é mockado.

**Fase 3 — Verificação:**
8. `pnpm check` (TypeScript) + subir o app e validar as 3 telas (Dashboard, Login, 404).

## Matriz de decisão (manter × remover)

| Bloco | Remover dá… | Manter faz sentido se… |
|-------|-------------|------------------------|
| Componentes/hooks/UI mortos (A,B,C) | −arquivos, build + claro | (nenhum motivo forte p/ manter) |
| Módulos `_core` mortos (D) | servidor enxuto | for reusar integrações Manus (voz/imagem/mapa) |
| Backend tRPC/MySQL/S3 (E) | **−1 banco, −1 stack inteira** | quiser histórico persistente, multiusuário, painel admin real |
| Dependências (F) | install + rápido, menos disco | — |

---

## Recomendação

- **Fazer a Fase 1 sem hesitar** — é puramente código morto, baixo risco, e melhora muito a clareza.
- **Discutir a Fase 2** — depende da sua visão de produto: se o objetivo é só o **chat RAG via API Python**, o backend Manus inteiro é peso morto e vale remover. Se há intenção de ter histórico/multiusuário no futuro, vale manter (mesmo órfão) ou portar para a API Python.

> **Importante:** o projeto **não está sob git**. Antes de executar qualquer remoção, recomendo `git init` + commit inicial, para que tudo seja reversível.
