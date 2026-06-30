# Guia de Uso - RAG Tutor System

## Visão Geral

O **RAG Tutor System** é um sistema inteligente de tutoria baseado em **Retrieval-Augmented Generation (RAG)** que utiliza inteligência artificial para fornecer respostas contextualizadas sobre documentos indexados.

## Estrutura de Acesso

### 1. Autenticação

A aplicação utiliza **OAuth Manus** para autenticação segura. Ao acessar o sistema, você será redirecionado para a tela de login.

**Fluxo de Login:**
1. Clique em "Entrar com Manus"
2. Autentique-se com suas credenciais Manus
3. Você será redirecionado automaticamente para o dashboard

### 2. Tipos de Usuário

#### **Usuário Comum**
- Acesso apenas ao **Chat Principal**
- Pode fazer perguntas sobre documentos indexados
- Visualiza histórico de conversas
- Sem acesso a gerenciamento de documentos

#### **Administrador**
- Acesso completo ao sistema
- **Sidebar Esquerda**: Gerenciamento de documentos
- **Área Central**: Chat principal (igual ao usuário comum)
- **Painel Direito**: Informações e estatísticas do sistema

## Funcionalidades por Tipo de Usuário

### Para Usuários Comuns

#### Chat Principal
1. **Criar Nova Conversa**: Clique em "Nova Conversa" para iniciar uma nova sessão
2. **Fazer Perguntas**: Digite sua pergunta no campo de entrada
3. **Enviar Mensagem**: Pressione Enter ou clique no botão Enviar
4. **Histórico**: Todas as mensagens são salvas automaticamente
5. **Limpar Conversa**: Use o botão de lixeira para limpar a conversa atual

**Dicas:**
- Use Shift+Enter para quebra de linha
- As respostas suportam Markdown
- O indicador de digitação mostra quando a IA está processando

### Para Administradores

#### Sidebar Esquerda - Gerenciamento de Documentos

1. **Enviar Documento**
   - Clique em "Enviar Documento"
   - Selecione um arquivo (PDF, DOCX ou TXT)
   - Máximo de 50MB por arquivo
   - Clique em "Enviar"

2. **Listagem de Documentos**
   - Visualize todos os documentos enviados
   - Veja o status de indexação:
     - **Pendente**: Aguardando processamento
     - **Processando**: Sendo indexado
     - **Indexado**: Pronto para uso
     - **Falha**: Erro no processamento
   - Visualize a quantidade de chunks por documento

3. **Remover Documento**
   - Clique no ícone de lixeira ao lado do documento
   - Confirme a remoção

4. **Atualizar Lista**
   - Clique em "Atualizar" para sincronizar com o servidor

#### Painel Direito - Informações da Arquitetura

O painel exibe informações importantes sobre o sistema RAG:

**Status da API**
- Mostra se o sistema está operacional ou degradado
- Verde = Operacional
- Amarelo = Degradado

**Estatísticas**
- **Documentos**: Total de documentos indexados
- **Chunks**: Total de segmentos de texto criados
- **Mensagens**: Total de mensagens trocadas
- **Usuários**: Total de usuários do sistema

**Configuração**
- **Modelo LLM**: Modelo de IA utilizado (ex: Claude 3.5)
- **Banco Vetorial**: Sistema de armazenamento de embeddings (ex: Pinecone)
- **Dimensão**: Dimensionalidade dos vetores
- **Estratégia RAG**: Tipo de busca utilizada (ex: Hybrid)

**Sistema**
- **Versão**: Versão atual do sistema
- **Última Atualização**: Data da última sincronização

#### Chat Principal (Admin)

Funciona igual ao usuário comum, mas com a vantagem de que o admin pode:
- Gerenciar documentos que alimentam o RAG
- Monitorar o sistema em tempo real
- Visualizar estatísticas de uso

## Fluxo de Uso Recomendado

### Para Administradores

1. **Configuração Inicial**
   - Faça login como administrador
   - Envie documentos relevantes para a disciplina
   - Aguarde a indexação ser concluída
   - Verifique as estatísticas no painel direito

2. **Monitoramento**
   - Acompanhe o status de indexação dos documentos
   - Monitore as estatísticas de uso
   - Adicione novos documentos conforme necessário

3. **Suporte a Usuários**
   - Teste o chat com perguntas sobre os documentos
   - Verifique se as respostas estão corretas
   - Adicione mais documentos se necessário

### Para Usuários Comuns

1. **Primeiro Acesso**
   - Faça login
   - Crie uma nova conversa
   - Faça uma pergunta sobre o conteúdo

2. **Uso Contínuo**
   - Navegue entre conversas anteriores
   - Faça novas perguntas
   - Salve respostas importantes

## Dicas e Boas Práticas

### Qualidade de Perguntas
- **Seja específico**: Perguntas detalhadas geram respostas melhores
- **Use contexto**: Mencione o tópico ou capítulo relevante
- **Faça uma pergunta por vez**: Facilita o processamento

### Gerenciamento de Documentos (Admin)
- **Organize por tema**: Agrupe documentos por disciplina ou tópico
- **Atualize regularmente**: Adicione novos materiais conforme necessário
- **Monitore a indexação**: Verifique se todos os documentos foram processados
- **Remova duplicatas**: Evite documentos repetidos

### Performance
- O chat responde em tempo real
- Documentos grandes podem levar mais tempo para indexar
- As respostas são contextualizadas com base nos documentos
- O histórico é persistente entre sessões

## Troubleshooting

### Problema: Chat não responde
**Solução**: Verifique se há documentos indexados. Se não houver, envie novos documentos.

### Problema: Documento não foi indexado
**Solução**: 
- Verifique o tamanho (máximo 50MB)
- Tente enviar novamente
- Verifique a conexão com a internet

### Problema: Respostas imprecisas
**Solução**:
- Adicione mais documentos relevantes
- Faça perguntas mais específicas
- Verifique se o documento contém a informação

### Problema: Não consegue fazer login
**Solução**:
- Verifique suas credenciais Manus
- Limpe cookies do navegador
- Tente em outro navegador

## Suporte

Para problemas técnicos ou dúvidas, entre em contato com o administrador do sistema.

---

**Versão**: 1.0.0  
**Última Atualização**: Junho 2026
