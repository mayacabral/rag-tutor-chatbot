# RAG Tutor System - TODO

## Autenticação e Acesso
- [x] Implementar página de login com integração OAuth Manus
- [x] Criar contexto de autenticação global com suporte a papéis (admin/user)
- [x] Implementar proteção de rotas baseada em papéis
- [x] Criar página de logout e gerenciamento de sessão

## Layout e Navegação
- [x] Criar layout dashboard com três colunas para admin (sidebar, chat, painel direito)
- [x] Criar layout simples com chat central para usuário comum
- [x] Implementar header com informações do usuário e botão de logout
- [ ] Implementar responsividade para mobile/tablet

## Chat Principal
- [x] Criar componente de chat com histórico de mensagens
- [x] Implementar renderização de Markdown nas respostas
- [x] Implementar scroll automático para novas mensagens
- [x] Implementar indicador de "IA digitando"
- [x] Implementar campo de entrada de texto com envio de mensagens
- [ ] Implementar botão para limpar conversa
- [x] Integrar com API de chat para envio de perguntas
- [x] Implementar persistência do histórico de conversa por sessão
- [ ] Implementar suporte a streaming de respostas em tempo real

## Sidebar Esquerda (Admin)
- [x] Criar componente de upload de documentos (PDF, DOCX, TXT)
- [x] Implementar listagem de documentos enviados
- [x] Implementar remoção de documentos
- [x] Exibir status de indexação/processamento
- [ ] Implementar botão para reprocessar embeddings
- [x] Integrar com API de upload de documentos

## Painel Lateral Direito (Admin)
- [x] Criar painel informativo com arquitetura da IA
- [x] Exibir modelo de IA utilizado
- [x] Exibir banco vetorial utilizado
- [x] Exibir quantidade de documentos indexados
- [x] Exibir quantidade de chunks
- [x] Exibir status da API
- [x] Exibir configurações do sistema RAG
- [x] Exibir estatísticas básicas de uso
- [ ] Implementar auto-refresh de informações

## Integração com Backend RAG
- [x] Criar serviços para comunicação com API de chat
- [x] Criar serviços para upload de documentos
- [x] Criar serviços para consulta de status do sistema
- [ ] Implementar tratamento de erros e retry logic
- [x] Implementar loading states e feedback visual

## Banco de Dados
- [x] Criar tabela de conversas/histórico de chat
- [x] Criar tabela de documentos
- [x] Criar tabela de estatísticas de uso
- [x] Implementar queries para persistência de histórico

## Estilo Visual
- [ ] Definir paleta de cores moderna e profissional
- [ ] Definir tipografia e espaçamento
- [ ] Implementar tema escuro/claro (opcional)
- [ ] Aplicar estilo consistente em todos os componentes
- [ ] Implementar animações e transições suaves

## Testes e Validação
- [x] Escrever testes unitários para componentes principais
- [ ] Testar fluxo de autenticação
- [ ] Testar upload e listagem de documentos
- [ ] Testar envio e recebimento de mensagens
- [ ] Testar responsividade em diferentes dispositivos

## Deployment
- [ ] Configurar variáveis de ambiente
- [ ] Preparar para publicação
- [ ] Documentar instruções de uso
