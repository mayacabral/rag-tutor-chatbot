# Plano — Segunda IA "Revisora" sobre a saída do RAG

> Ideia: acoplar ao fluxo RAG um **segundo LLM (revisor/refinador)** que lê a saída bruta
> (pergunta + trechos recuperados + resposta) e devolve uma **mensagem melhor** para o
> usuário final — mais didática, fiel às fontes e no tom de um "Tutor de turma".
> **Documento de análise — nada implementado ainda.** Serve para decidirmos viabilidade.

## 1. O padrão: "Generator → Reviewer"

Hoje o fluxo é de um LLM só:

```
/perguntar → embed (nuvem) → busca vetorial (Mongo) → LLM gerador (Qwen2.5-7B) → resposta
```

A ideia adiciona uma etapa de **pós-processamento** por um segundo modelo:

```
… → LLM gerador (Qwen) → resposta bruta
                              │  (pergunta + contexto recuperado + resposta bruta)
                              ▼
                     LLM REVISOR → resposta final (melhor)
```

**O que o revisor faz** (prompt controlável):
- Reescreve de forma **didática** e clara (é um tutor de turma → tom pedagógico).
- **Fidelidade às fontes:** não pode inventar além do que os trechos recuperados dizem; se a resposta bruta extrapolou, corrige ou sinaliza incerteza.
- Estrutura melhor (passos, listas, exemplos quando fizer sentido).
- Mantém/organiza as **citações** (arquivo/página).
- Opcional: ajusta o nível de linguagem ao público (aluno).

> É o mesmo padrão de "refiner"/"grounded rewrite" comum em produtos RAG — barato de implementar e com bom retorno de qualidade percebida.

## 2. Onde encaixa no código

A mudança é **quase toda no backend** (`rag.py`), pequena e localizada:

1. Nova função `revisar_resposta(pergunta, contexto, resposta_bruta) -> str`.
2. O `/perguntar` passa a: gerar a resposta (como hoje) → montar o contexto dos trechos → chamar `revisar_resposta` → retornar a versão revisada + as fontes.
3. **Fallback:** se o revisor falhar (timeout, cota, erro), retorna a resposta bruta — nunca quebra o chat.

Esboço (ilustrativo):

```python
def revisar_resposta(pergunta, contexto, resposta_bruta) -> str:
    # contexto = texto concatenado dos trechos recuperados (com fonte/página)
    # ... chama o LLM revisor com um prompt de "tutor" ...
    return resposta_revisada
```

No `/perguntar`, hoje o `perguntar()` já devolve `resposta` + `fontes` (que vêm dos
`source_documents`). Basta capturar os trechos, revisar e trocar o texto final.

**Impacto no frontend:** praticamente nenhum. O contrato do `/perguntar`
(`{answer, sources}`) permanece. No máximo, um selo "revisado por IA" no `ApiChatPanel`.

## 3. Qual modelo usar como Revisor? (principal decisão)

| Opção | Modelo | Prós | Contras |
|-------|--------|------|---------|
| **A. Claude (recomendado)** | `claude-opus-4-8` (padrão) | Melhor qualidade de escrita/tom pedagógico; excelente em fidelidade e reescrita; SDK oficial | Nova dependência (`anthropic`) + **nova chave** `ANTHROPIC_API_KEY`; custo por token |
| **B. HuggingFace (mesmo stack)** | outro modelo HF (ex.: um instruct maior) | Sem nova dependência/chave; reaproveita o `HUGGINGFACEHUB_API_TOKEN` | Qualidade/tom inferiores; menos confiável em "não inventar" |
| **C. Mesmo modelo, 2ª passada** | Qwen2.5-7B de novo | Zero infra nova | Ganho pequeno — o mesmo modelo tende a repetir os mesmos erros |

**Recomendação:** **Opção A com Claude**, porque a tarefa é essencialmente "reescrita
fiel e didática", onde a qualidade do redator importa muito e é exatamente a força da Claude.

### Detalhes da Opção A (Claude)

- **Pacote:** `anthropic` (SDK oficial Python).
- **Chave:** `ANTHROPIC_API_KEY` no `.env` (o SDK lê do ambiente).
- **Modelo padrão:** `claude-opus-4-8` (mais capaz). 
  - Se quiser **mais barato/rápido** para um refinador simples, dá para usar `claude-haiku-4-5` — mas isso é sua escolha explícita.
- **Chamada** (não-streaming, `max_tokens` modesto para latência baixa):

```python
import anthropic
client = anthropic.Anthropic()  # lê ANTHROPIC_API_KEY do .env

def revisar_resposta(pergunta, contexto, resposta_bruta) -> str:
    resp = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        system=(
            "Você é um tutor de turma. Reescreva a resposta para o aluno de forma "
            "clara e didática, fiel APENAS ao contexto fornecido. Não invente fatos "
            "que não estejam no contexto; se algo não estiver, diga que não consta. "
            "Mantenha as citações de fonte. Não invente novas fontes."
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Pergunta do aluno:\n{pergunta}\n\n"
                f"Trechos recuperados (contexto):\n{contexto}\n\n"
                f"Resposta bruta do sistema:\n{resposta_bruta}\n\n"
                "Reescreva a melhor resposta final para o aluno."
            ),
        }],
    )
    return "".join(b.text for b in resp.content if b.type == "text")
```

> Preços de referência (por 1M tokens): Opus 4.8 **$5 / $25** (entrada/saída); Haiku 4.5 **$1 / $5**; Sonnet 4.6 **$3 / $15**. Como o refinador recebe só a pergunta + poucos trechos + a resposta, o custo por chamada é baixo.

## 4. Design do prompt do Revisor (o que mais importa)

O sucesso depende do prompt. Diretrizes:
- **Papel:** "tutor de turma" (tom acolhedor, explicativo, adequado a aluno).
- **Regra de ouro (anti-alucinação):** responder **somente** com base no contexto recuperado; se faltar informação, dizer explicitamente "não consta nos documentos".
- **Preservar citações:** manter arquivo/página das fontes.
- **Formato:** clareza > verbosidade; usar passos/listas quando ajudar.
- **Não repetir** a pergunta nem "encher linguiça".

## 5. Fluxo final e contrato da API

- `/perguntar` continua recebendo `{question, history?}` e devolvendo `{answer, sources}`.
- Internamente: `answer` passa a ser a **versão revisada**.
- (Opcional) adicionar um campo `answer_raw` para depuração/comparação — o front pode ignorar.

## 6. Trade-offs

| Aspecto | Impacto |
|---------|---------|
| **Qualidade** | ↑↑ (é o objetivo) — respostas mais claras, fiéis e didáticas |
| **Latência** | ↑ (duas chamadas de LLM em série). Mitigável com `max_tokens` baixo e modelo rápido |
| **Custo** | ↑ (uma chamada extra por pergunta). Baixo por resposta, mas some com volume |
| **Complexidade** | Baixa — 1 função nova + 1 alteração no endpoint |
| **Robustez** | Mantida com **fallback** para a resposta bruta se o revisor falhar |

## 7. Plano de implementação (fases)

**Fase 1 — Backend (núcleo):**
1. Adicionar `anthropic` ao `requirements.txt`; `ANTHROPIC_API_KEY` no `.env`.
2. Implementar `criar_revisor()` + `revisar_resposta(...)` em `rag.py`.
3. Alterar `/perguntar` para revisar antes de responder, com **try/except → fallback** para a resposta bruta.

**Fase 2 — Qualidade:**
4. Iterar no prompt do tutor (tom, anti-alucinação, citações).
5. (Opcional) Config por ambiente: `REVISOR_ATIVO=true/false` e `REVISOR_MODELO=...` para ligar/desligar e trocar modelo sem mexer no código.

**Fase 3 — Observabilidade/UX (opcional):**
6. Logar `answer_raw` vs `answer` para comparar.
7. Selo "revisado" no `ApiChatPanel`.

**Fase 4 — Verificação:**
8. Testes lado a lado (mesmas perguntas, com/sem revisor) para confirmar ganho real.

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Revisor "inventa" além das fontes | Prompt restritivo + passar o contexto recuperado; instruir "não consta" |
| Latência maior no chat | `max_tokens` baixo; modelo rápido (Haiku) para o refino; flag para desligar |
| Custo com volume | Refino só quando há documentos/contexto; cache de perguntas frequentes (futuro) |
| Dependência de nova chave/serviço | Flag `REVISOR_ATIVO=false` mantém o sistema funcionando só com o Qwen |
| Chave exposta | `ANTHROPIC_API_KEY` só no `.env` (já ignorado pelo git) |

## 9. Matriz de decisão (viabilidade)

| Caminho | Vale a pena se… |
|---------|-----------------|
| **A. Claude como revisor** | você quer o **melhor** ganho de qualidade/tom e aceita uma chave + custo por token (recomendado) |
| **B. HuggingFace como revisor** | quer evitar nova dependência/serviço e topa qualidade menor |
| **C. Não fazer** | o Qwen já entrega respostas boas o suficiente para o seu caso |

## 10. Recomendação

- **Fazer, com a Opção A (Claude `claude-opus-4-8`)** — a tarefa é "reescrita fiel e didática", exatamente onde um redator forte agrega mais. Começar simples: 1 função + fallback + flag para ligar/desligar.
- Se **custo/latência** forem sensíveis, usar `claude-haiku-4-5` no refino (sua escolha explícita) — mantém o padrão e reduz gasto.
- Manter **`REVISOR_ATIVO`** como interruptor: assim o sistema nunca fica refém do segundo modelo.

> Próximo passo sugerido, se aprovado: implementar a **Fase 1** atrás da flag `REVISOR_ATIVO=false` (desligado por padrão), testar lado a lado e só então ligar.
