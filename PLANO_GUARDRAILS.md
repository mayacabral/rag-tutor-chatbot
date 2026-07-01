# Plano — Guardrails (cercas de proteção) para o Tutor de Turma

> Como adicionar guardrails ao RAG (segurança, fidelidade e robustez) sem transformar
> o projeto num monstro. Foco no stack atual: **FastAPI + LangChain + Qwen (gerador 7B +
> revisor 72B) + bge-m3 + MongoDB Atlas**.
> **Documento de análise — nada implementado ainda.** Serve para decidir o quê e quando fazer.

## 1. O que já existe (guardrails parciais ✅)

- **Revisor (2ª IA)** com regra de *fidelidade ao contexto* → guardrail de **groundedness** (reduz alucinação).
- **Validação de entrada** básica: `AskRequest.question` com `min_length=1` (Pydantic).
- **Guarda "sem documentos"**: `/perguntar` retorna `400` se a coleção está vazia.
- **`max_new_tokens=512`** limita o tamanho da saída (gerador e revisor).
- **CORS** configurado (hoje aberto: `allow_origins=["*"]`).

## 2. Arquitetura de guardrails em camadas

```
Pergunta
   │
   ▼
[ENTRADA]   validação de tamanho · rate limit · anti-injeção/jailbreak
   │
   ▼
[RETRIEVAL] limiar de relevância (score) · "sem contexto → recusa"
   │
   ▼
[GERADOR 7B] → resposta bruta
   │
   ▼
[REVISOR 72B] groundedness (fidelidade ao contexto) · citações
   │
   ▼
[SAÍDA]     moderação (toxicidade) · PII (redação) · formato/refusal
   │
   ▼
Resposta + fontes   (tudo logado para auditoria)
```

---

## Fase 1 — Kit inicial (alto impacto, baixo esforço) 🥇

### 1.1 Limiar de relevância no retrieval (o mais valioso)
**Problema que resolve:** trechos irrelevantes entrando no contexto (o caso do "PDF de IA" que apareceu nos testes).

**Como:** em vez de aceitar sempre os `k=4` trechos, filtrar por **score de similaridade** e descartar os fracos.

```python
# esboço em rag.py
LIMIAR_SCORE = 0.6  # ajustar empiricamente (bge-m3, cosseno)

def buscar_relevantes(vector_store, pergunta, k=4, limiar=LIMIAR_SCORE):
    # MongoDBAtlasVectorSearch expõe similarity_search_with_score
    pares = vector_store.similarity_search_with_score(pergunta, k=k)
    return [doc for doc, score in pares if score >= limiar]
```
No `/perguntar`, usar os trechos filtrados para montar o contexto e alimentar o gerador.

**Esforço:** baixo · **Dependências:** nenhuma (já temos o vector store).

### 1.2 "Sem contexto relevante → recusa educada"
Se, após o filtro (1.1), **nenhum** trecho passou, **não chamar o LLM**: responder direto como tutor.

```python
if not docs_relevantes:
    return AskResponse(
        answer="Não encontrei isso nos documentos da disciplina. "
               "Você pode reformular ou enviar um material que trate desse tema?",
        sources=[],
    )
```
**Por quê:** evita o LLM "forçar" uma resposta a partir de contexto ruim (alucinação).
**Esforço:** baixo.

### 1.3 Limite de tamanho da entrada
Reforçar o `AskRequest` para barrar entradas absurdas (abuso/custo):

```python
class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    history: list[tuple[str, str]] | None = None
```
**Esforço:** trivial.

### 1.4 Rate limiting (proteção de abuso/custo)
Com **`slowapi`** (padrão para FastAPI):

```python
# pip install slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/perguntar")
@limiter.limit("20/minute")     # ajustar
def ask_question(request: Request, payload: AskRequest): ...
```
**Por quê:** cada `/perguntar` dispara 2 LLMs (gerador + revisor 72B) — sem limite, um abuso vira custo/latência.
**Esforço:** baixo · **Dependência:** `slowapi`.

---

## Fase 2 — Segurança de conteúdo (entrada/saída) 🛡️

### 2.1 Anti-prompt-injection / jailbreak (entrada)
Barrar "ignore o system prompt", "revele suas instruções", "aja como…".

**Opção leve (heurística):** lista de padrões suspeitos + rejeição/aviso. Rápido, mas driblável.

**Opção robusta:** [`llm-guard`](https://github.com/protectai/llm-guard) com o scanner `PromptInjection`:
```python
# pip install llm-guard
from llm_guard.input_scanners import PromptInjection
scanner = PromptInjection()
_, is_valid, _ = scanner.scan(pergunta)
if not is_valid:
    raise HTTPException(400, "Entrada bloqueada por segurança.")
```
> ⚠️ Puxa um modelo classificador (peso extra na imagem/latência). Avaliar se compensa.

### 2.2 Moderação de toxicidade (saída, opcional)
Se o público é aluno, filtrar linguagem tóxica na resposta final: `llm-guard` (`Toxicity`) ou `Detoxify`.

### 2.3 PII — dados pessoais (entrada e/ou saída, opcional)
Se alunos colarem CPF/e-mail/telefone, redigir com [Microsoft Presidio](https://github.com/microsoft/presidio) antes de logar/armazenar.

---

## Fase 3 — Qualidade, auditoria e produção 🔎

### 3.1 Groundedness programático (reforço do revisor)
Hoje o revisor garante fidelidade **por prompt**. Reforço: pedir ao revisor uma **saída estruturada** com nota de confiança, e agir sobre ela.

```python
# revisor devolve JSON: {"resposta": "...", "fundamentada": true/false}
# se fundamentada == false -> anexar aviso de incerteza ou recusar
```
Alternativa de **medição** (não bloqueante): [RAGAS](https://github.com/explodinggradients/ragas) (`faithfulness`, `answer_relevancy`) para avaliar o RAG offline.

### 3.2 Logging / auditoria
Registrar por pergunta: `pergunta`, `scores` dos trechos, `contexto`, `resposta_bruta`, `resposta_revisada`, latências. Ajuda a **calibrar o limiar** (1.1) e auditar respostas.

### 3.3 Autenticação real
Hoje o login é **mockado** (`useAuth`). Antes de produção, trocar por auth de verdade e **restringir o CORS** (`allow_origins` para o domínio do front).

---

## Frameworks (quando usar cada um)

| Ferramenta | Para quê | Quando adotar |
|-----------|----------|---------------|
| [NVIDIA NeMo Guardrails](https://github.com/NVIDIA-NeMo/Guardrails) | Rails programáveis (injeção, tópico, fact-check) | Se quiser uma camada declarativa completa (mais peso) |
| [protectai/llm-guard](https://github.com/protectai/llm-guard) | Scanners de entrada/saída (injeção, toxicidade, PII) | Fase 2, sob demanda |
| [Guardrails AI](https://github.com/guardrails-ai/guardrails) | Validadores Python plugáveis | Alternativa ao llm-guard |
| [RAGAS](https://github.com/explodinggradients/ragas) | **Medir** faithfulness/relevância | Fase 3 (avaliação) |
| [Microsoft Presidio](https://github.com/microsoft/presidio) | Detecção/redação de PII | Se houver dado pessoal |

> **Filosofia:** comece com guardrails **nativos no `rag.py`** (Fase 1) — resolvem 80% do risco real sem framework novo. Só traga NeMo/llm-guard quando a necessidade aparecer.

---

## Matriz de prioridade

| Guardrail | Impacto | Esforço | Dependência | Prioridade |
|-----------|---------|---------|-------------|------------|
| 1.1 Limiar de relevância | ★★★ | baixo | — | **agora** |
| 1.2 Recusa sem contexto | ★★★ | baixo | — | **agora** |
| 1.3 Limite de entrada | ★ | trivial | — | **agora** |
| 1.4 Rate limiting | ★★ | baixo | slowapi | **agora** |
| 2.1 Anti-injeção | ★★ | médio | llm-guard | depois |
| 2.2 Toxicidade | ★ | médio | llm-guard/Detoxify | opcional |
| 2.3 PII | ★★ | médio | Presidio | se houver PII |
| 3.1 Groundedness estruturado | ★★ | médio | — | depois |
| 3.2 Logging/auditoria | ★★ | baixo | — | recomendado |
| 3.3 Auth real + CORS restrito | ★★★ | médio | — | antes de produção |

## Riscos e cuidados
- **Falsos positivos:** limiar (1.1) e anti-injeção (2.1) muito agressivos podem bloquear perguntas legítimas → calibrar com logs (3.2).
- **Peso/latência:** scanners de ML (llm-guard, Detoxify) aumentam imagem e tempo → medir antes de adotar.
- **Custo:** groundedness estruturado pode virar uma 3ª chamada de LLM → avaliar.

## Recomendação
Fazer **Fase 1 (1.1 → 1.4)** primeiro — é o melhor custo-benefício e cabe direto no `rag.py`, resolvendo o problema real de retrieval e a proteção básica de abuso. Fases 2 e 3 entram sob demanda, conforme o projeto for para produção.

> Próximo passo sugerido, se aprovado: implementar **1.1 + 1.2** (limiar + recusa) e medir o efeito nas respostas com alguns documentos reais.
