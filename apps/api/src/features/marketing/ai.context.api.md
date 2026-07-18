# ai.context.api.md — Central de Marketing e IA

---

## Purpose

Central privada para planejar marketing, manter documentos versionados e usar uma consultoria de IA
contextual do Lucro Caseiro. Estrutura públicos, funcionalidades, temas, conteúdo, distribuição,
campanhas e resultados sem expor esses dados às usuárias do app comercial.

## Non-goals

- Não publica automaticamente em redes sociais.
- Não altera dados operacionais de clientes, preços ou planos do produto.
- Não permite aprendizado automático sobre missão, ética, permissões ou fatos financeiros canônicos.
- Não faz treinamento de pesos de modelo; “treinamento” significa instruções, conhecimento, exemplos,
  avaliações, feedback e adaptações auditáveis.

## Boundaries & Ownership

- Rotas em `/api/v1/marketing`, sempre após `authMiddleware` e allowlist `MARKETING_USER_IDS`.
- Contratos em `packages/contracts/src/schemas/marketing.ts`.
- Tabelas Drizzle em `packages/database/src/schema/marketing.ts`; migration `036_marketing_pwa.sql`.
- PWA consumidora em `apps/web`; anexos ficam no bucket privado `marketing-documents`.
- IA usa Gemini 2.5 Flash por meio do AI SDK; a chave existe apenas na API.

## Code pointers

- `marketing.routes.ts`: endpoints privados, exports Markdown/PDF e treinamento.
- `marketing.usecases.ts`: importação inicial, contexto da IA, avaliações e aprendizado A/B/C.
- `marketing.repo.pg.ts`: escopo por usuária, documentos/versões, chats e trilha de aprendizado.
- `marketing.seed.ts`: públicos, funcionalidades, canais, campanha e calendário inicial de 28 peças.
- `marketing.system-prompt.ts`: instrução oficial fornecida pela fundadora.
- `marketing.domain.test.ts`: invariantes do seed, instrução protegida e score de avaliação.

## Data Model

- `marketing_resources`: agregado flexível tipado por `kind`, com status, agenda e contexto JSON.
- `marketing_documents`, `marketing_document_versions`, `marketing_document_attachments`.
- `marketing_ai_sessions`, `marketing_ai_messages`, `marketing_ai_instructions`.
- `marketing_ai_knowledge`, `marketing_ai_examples`, `marketing_ai_evaluations`.
- `marketing_ai_feedback`, `marketing_ai_learning`, `marketing_ai_settings`.

## Invariants

- Toda leitura/escrita recebe `userId` do token; nunca do corpo.
- Em produção, allowlist vazia nega acesso.
- Importação inicial é idempotente por `(user_id, kind, slug)` e por slug de documento.
- Cada salvamento de documento cria versão recuperável no servidor.
- Classe A pode aplicar preferências explícitas; Classe B nasce em `shadow`; Classe C fica protegida.
- Respostas da IA não viram documento ou ação sem comando explícito da usuária.

## Operations

- `GET /dashboard`, `POST /seed`.
- CRUD `/resources` e `/documents`; anexos em `/documents/:id/attachments`.
- Export em `/documents/:id/export.md|pdf`.
- Conversas em `/ai/sessions` e `POST /ai/chat`; feedback em `/ai/feedback`.
- Rascunhos em `POST /ai/resources/draft`; banco ranqueado em `POST /ai/content/ideas`.
- Campanhas guiadas em `POST /ai/campaigns/strategy` e `POST /ai/campaigns/copies`: o plano
  editável precisa de aprovação explícita antes do handoff para o copywriter.
- Governança em `/ai/training`: instruções, conhecimento, exemplos, avaliações e settings.

## Authorization & RLS

- `authMiddleware` valida o JWT Supabase; `privateMarketingAccess` aplica a allowlist.
- Tabelas de marketing têm RLS habilitado e privilégios de `anon`/`authenticated` revogados.
- O bucket aplica políticas por primeira pasta igual ao `auth.uid()`.
- A API acessa as tabelas pelo usuário de banco do servidor; o navegador nunca consulta as tabelas.

## Contracts (Zod/DTO)

- `MarketingResourceInputSchema` e patch/query para o agregado por `kind`.
- `MarketingDocumentInputSchema`, patch e metadados de anexo.
- `MarketingAiMessageInputSchema`, instrução, conhecimento, feedback e avaliação.
- `MarketingContentIdeasInputSchema` aceita contexto opcional; a saída valida ideias, indicadores e
  o briefing aplicável de cada sugestão.
- `MarketingCampaignBriefInputSchema`, `MarketingCampaignPlanSchema` e
  `MarketingCampaignCopiesInputSchema` validam briefing, plano aprovado e pacote criativo. Cada
  geração devolve mensagem auditável e telemetria de prompt/versão/modelo/parse.
- `MarketingLearningPolicySchema` mantém A/B ligadas, C desligada, amostra e score limitados.

## Errors

- 400 para contratos inválidos; 401 sem sessão; 403 fora da allowlist; 404 fora do escopo.
- 503 quando a chave de IA não está configurada; demais módulos continuam funcionando.

## Events / Side effects

- Seed faz upsert idempotente e publica a primeira instrução quando ainda não há uma ativa.
- Salvamento de documento cria uma nova versão na mesma transação.
- Feedback explícito pode gerar conhecimento Classe A; a amostra mínima cria candidato Classe B em
  shadow. Nenhuma ação externa é disparada.

## Performance

- Dashboard carrega recursos, documentos, sessões e configurações em paralelo.
- Chat limita contexto às 10 mensagens, 12 fontes, 5 exemplos e 60 recursos mais relevantes.
- Índices cobrem usuário/tipo, agenda, atualização de documentos, sessões e mensagens.

## Security & Privacy

- Prompts, documentos e respostas não são registrados em logs.
- Anexos aceitam apenas PDF/DOCX de até 20 MB e são baixados por URL assinada temporária.
- O contexto enviado ao provedor é limitado às últimas 10 mensagens, 12 fontes, 5 exemplos e dados
  estruturados relevantes da própria usuária.

## Test matrix

- Seed contém 28 peças únicas em quatro semanas.
- Instrução mantém regras contra invenção e alterações protegidas.
- Banco de ideias remove sugestões que repetem título, gancho, CTA ou emoção principal.
- Score de avaliação compara termos relevantes do esperado com a resposta.
- Suíte completa da API e builds web/API são gates de entrega.

## Examples

- `POST /api/v1/marketing/seed` importa a base e pode ser repetido sem duplicar.
- `POST /api/v1/marketing/ai/chat` com `{ "message": "Crie uma semana de posts" }` cria uma
  sessão e devolve uma mensagem da consultoria.
- `PATCH /api/v1/marketing/documents/:id` salva o Markdown e gera a próxima versão recuperável.

## Change log / Decisions

- 2026-07-14: implementação inicial seguindo a arquitetura do Lunoa: Next App Router, Express por
  feature, contratos Zod, Drizzle/Postgres, Supabase Auth, React Query e AI SDK com Gemini.
- 2026-07-14: aprendizado híbrido A/B/C; automático somente onde o risco permite.
- 2026-07-17: Banco Inteligente de Ideias passou a gerar ranking estratégico com indicadores
  heurísticos e briefing pronto para revisão.
- 2026-07-18: `interview` entrou como recurso operacional. O seed cria dez fichas de entrevista
  por segmento e uma campanha-piloto de mídia bloqueada por readiness, otimizada por negócio
  ativado em vez de clique ou instalação.
