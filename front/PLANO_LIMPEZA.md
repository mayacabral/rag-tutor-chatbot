# Plano de Limpeza — `/front`

> Levantamento de código não utilizado no frontend.
> **Status: Fase 1 ✅ concluída · Fase 2 ✅ concluída · Fase 3 ✅ verificada.**

## ✅ Status de execução (atualizado)

| Fase | Estado | Commit |
|------|--------|--------|
| Snapshot inicial (rede de segurança) | ✅ | `9e92bb3` |
| **Fase 1** — código morto (componentes, hooks, UI, módulos, deps) | ✅ concluída | `35c744d` |
| **Fase 2** — aposentar backend tRPC/MySQL/S3 | ✅ concluída | `beb7c3f` |
| **Fase 3** — verificação (`tsc`, Vite, app) | ✅ sem erros | — |

**Resultado:** ~80 arquivos e ~40 dependências removidos. Arquitetura final:
`front (React+Vite, servidor só serve o frontend) → API Python (FastAPI/RAG) → MongoDB Atlas + HuggingFace`.
O app segue 100% funcional (Dashboard / Login / 404). Tudo reversível via git.

---

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

## Plano de execução (em fases, do mais seguro ao mais estratégico)

**Fase 1 — Lixo óbvio (🟢, risco baixo) — ✅ CONCLUÍDA (`35c744d`):**
1. ✅ Removidos componentes mortos: `AIChatBox, ChatBox, DashboardLayout, DashboardLayoutSkeleton, ManusDialog, Map`.
2. ✅ Removidos hooks mortos: `useConversations, useDocuments, useComposition, usePersistFn, useMobile`.
3. ✅ Removidos 25 UI shadcn sem referência (42 → 17).
4. ✅ Removidos módulos `_core` mortos: `dataApi, heartbeat, imageGeneration, map, voiceTranscription`.
5. ✅ `pnpm remove` de `@aws-sdk/*`, `recharts`, `framer-motion` + 17 `@radix-ui/*` não usados + `embla/vaul/cmdk/input-otp/react-day-picker/react-resizable-panels/add` (28 no total).
6. ✅ Limpas `references/`, `.manus-logs/`.

**Fase 2 — Decisão estratégica (🔴) — ✅ CONCLUÍDA (`beb7c3f`):**
7. ✅ Backend tRPC/MySQL/S3 aposentado: removidos `routers.ts`, `db.ts`, `storage.ts`, `drizzle/`, e os módulos `_core` `llm/oauth/context/cookies/sdk/notification/trpc/env/storageProxy/systemRouter`. Servidor reduzido a **Express + Vite** (`index.ts` + `vite.ts`).
   - ✅ **Logout** virou local (usa `useAuth().logout` mockado, sem tRPC).
   - ✅ Cliente: removido `lib/trpc.ts` e o provider em `main.tsx`.
   - ✅ Deps removidas: `@trpc/*`, `superjson`, `mysql2`, `drizzle-orm`, `drizzle-kit`, `jose`, `cookie`, `zod`, `react-hook-form`, `@hookform/resolvers` + script `db:push`.

**Fase 3 — Verificação — ✅ FEITA:**
8. ✅ `pnpm check` (`tsc --noEmit`) sem erros + app sobe e renderiza as 3 telas (Dashboard/Login/404).

## Matriz de decisão (manter × remover)

| Bloco | Remover dá… | Manter faz sentido se… |
|-------|-------------|------------------------|
| Componentes/hooks/UI mortos (A,B,C) | −arquivos, build + claro | (nenhum motivo forte p/ manter) |
| Módulos `_core` mortos (D) | servidor enxuto | for reusar integrações Manus (voz/imagem/mapa) |
| Backend tRPC/MySQL/S3 (E) | **−1 banco, −1 stack inteira** | quiser histórico persistente, multiusuário, painel admin real |
| Dependências (F) | install + rápido, menos disco | — |

---

## Recomendação — ✅ executada

- **Fase 1 e Fase 2 foram executadas** (o objetivo é o **chat RAG via API Python**; o backend Manus era peso morto).
- O projeto **agora está sob git** (`git init` feito), com um commit por fase — tudo reversível via `git revert`/`git checkout`.

### Itens 🟡 que ficaram (opcional, baixa prioridade)
- 4 UI shadcn ainda presentes mas usados só internamente por `ui/sidebar` (não usado pelo app): `sheet, separator, toggle, sidebar`. Podem ser removidos se o `ui/sidebar` também sair.
- Artefatos Manus restantes: `template.json`, `todo.md`, `client/public/__manus__/`, `vite-plugin-manus-runtime`/coletor de debug no `vite.config`. Mantidos por enquanto (ligados ao build).

### Se um dia quiser histórico/multiusuário
Seria portado para a **API Python** (ex.: coleções no MongoDB para conversas/mensagens), e não o retorno do stack MySQL/tRPC da Manus.
