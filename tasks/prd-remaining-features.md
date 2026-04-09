# PRD: Funcionalidades Restantes — Lucro Caseiro

## Introducao

Este PRD cobre todas as funcionalidades pendentes do app Lucro Caseiro para leva-lo a um estado completo e pronto para producao. Inclui features core (edicao, historico, busca), monetizacao (pagamento preparado), qualidade de vida (offline, export, notificacoes) e infraestrutura (DB trigger, estoque).

O app ja possui: autenticacao, onboarding, CRUD de produtos/clientes/receitas/vendas/financeiro/embalagens/rotulos/precificacao, limites freemium com paywall, dark mode e testes (284 unitarios + 53 integracao).

## Goals

- Completar todas as features de CRUD com edicao e historico
- Tornar todas as telas acessiveis via navegacao (labels/rotulos)
- Implementar gestao de estoque com alertas
- Adicionar busca na tela de vendas
- Implementar tags de cliente editaveis
- Adicionar upload de foto de produto
- Preparar integracao de pagamento (sem provider especifico ainda)
- Implementar offline completo com sync bidirecional
- Exportar relatorios em PDF e Excel (mobile + API)
- Implementar notificacoes push (vendas pendentes, aniversarios, estoque baixo)
- Criar DB trigger para auto-criacao de usuario

---

## User Stories — Edicao de Receita

### US-001: Editar receita existente

**Descricao:** Como usuario, quero editar uma receita que ja cadastrei para corrigir ingredientes ou modo de preparo.

**Acceptance Criteria:**

- [ ] Botao "Editar" visivel no modal de detalhe da receita
- [ ] Abre formulario pre-preenchido com dados atuais (nome, categoria, instrucoes, rendimento, ingredientes)
- [ ] Permite adicionar/remover/editar ingredientes
- [ ] Salva via `PATCH /recipes/:id`
- [ ] Apos salvar, fecha o formulario e atualiza a lista
- [ ] Validacoes: nome obrigatorio, rendimento > 0, pelo menos 1 ingrediente
- [ ] Typecheck passa

### US-002: Excluir receita

**Descricao:** Como usuario, quero excluir uma receita que nao uso mais.

**Acceptance Criteria:**

- [ ] Botao "Excluir receita" no detalhe da receita
- [ ] Confirmacao via Alert antes de excluir
- [ ] Chama `DELETE /recipes/:id`
- [ ] Apos excluir, fecha modal e atualiza lista
- [ ] Typecheck passa

---

## User Stories — Edicao de Venda

### US-003: Editar itens de uma venda

**Descricao:** Como usuario, quero corrigir os itens de uma venda (ex: cliente errou o pedido).

**Acceptance Criteria:**

- [ ] Botao "Editar" no modal de detalhe da venda
- [ ] Permite alterar: itens (adicionar/remover), cliente, forma de pagamento
- [ ] Recalcula total automaticamente
- [ ] Salva via `PATCH /sales/:id` (novo endpoint se necessario)
- [ ] Nao permite editar vendas com status "cancelled"
- [ ] Typecheck passa

### US-004: Criar endpoint PATCH /sales/:id

**Descricao:** Como desenvolvedor, preciso de um endpoint para atualizar vendas completas.

**Acceptance Criteria:**

- [ ] `PATCH /api/v1/sales/:id` aceita: items, clientId, paymentMethod
- [ ] Valida que a venda pertence ao usuario
- [ ] Valida que a venda nao esta cancelada
- [ ] Recalcula total baseado nos novos itens
- [ ] Retorna venda atualizada
- [ ] Testes unitarios para o use case
- [ ] Typecheck passa

---

## User Stories — Historico de Compras do Cliente

### US-005: Listar compras de um cliente

**Descricao:** Como usuario, quero ver todas as compras que um cliente fez para entender seu perfil.

**Acceptance Criteria:**

- [ ] No detalhe do cliente, secao "Historico de compras" mostra lista real (substitui placeholder "Em breve")
- [ ] Cada item mostra: data, produtos, total, status
- [ ] Usa `GET /sales?clientId=xxx` (endpoint ja existe)
- [ ] Empty state: "Este cliente ainda nao fez nenhuma compra"
- [ ] Loading state enquanto carrega
- [ ] Typecheck passa

---

## User Stories — Labels/Rotulos Acessiveis

### US-006: Adicionar tela de rotulos na navegacao

**Descricao:** Como usuario, quero acessar a tela de rotulos pelo menu do app.

**Acceptance Criteria:**

- [ ] Criar `apps/mobile/src/app/labels.tsx` como tela stack
- [ ] Adicionar rota no `_layout.tsx` com header "Rotulos"
- [ ] Adicionar item "Rotulos" no menu "Mais" com icone `pricetag-outline`
- [ ] Tela lista rotulos existentes com `useLabels()`
- [ ] Botao "Novo rotulo" abre modal com `CreateLabelForm`
- [ ] Clicar em rotulo mostra preview (componente `LabelPreview` ja existe)
- [ ] Typecheck passa

---

## User Stories — Busca na Tela de Vendas

### US-007: Buscar vendas por produto ou cliente

**Descricao:** Como usuario, quero buscar uma venda especifica pelo nome do produto ou cliente.

**Acceptance Criteria:**

- [ ] Campo de busca na tela de vendas (abaixo dos filtros de status)
- [ ] Filtra vendas localmente pelo nome do produto ou cliente
- [ ] Busca case-insensitive
- [ ] Limpa busca com botao X ou ao limpar o campo
- [ ] Funciona em conjunto com os filtros de status (Todas, Pendentes, etc.)
- [ ] Typecheck passa

---

## User Stories — Tags de Cliente

### US-008: Editar tags de um cliente

**Descricao:** Como usuario, quero adicionar tags aos meus clientes para organiza-los (ex: "VIP", "frequente", "caloteiro").

**Acceptance Criteria:**

- [ ] No formulario de edicao de cliente, campo "Tags" com input de texto
- [ ] Ao digitar e pressionar Enter ou virgula, cria uma tag (chip)
- [ ] Tags aparecem como chips removiveis (X para remover)
- [ ] Maximo 10 tags por cliente, maximo 50 caracteres por tag
- [ ] Tags salvas via `PATCH /clients/:id` (campo `tags` ja existe no schema)
- [ ] Tags visiveis no detalhe do cliente (ja renderiza via Badge)
- [ ] Typecheck passa

### US-009: Adicionar tags na criacao de cliente

**Descricao:** Como usuario, quero adicionar tags ao criar um cliente.

**Acceptance Criteria:**

- [ ] Mesmo componente de tags do US-008 no formulario de criacao
- [ ] Tags enviadas no `POST /clients` (campo ja existe no DTO)
- [ ] Typecheck passa

---

## User Stories — Foto de Produto

### US-010: Upload de foto do produto

**Descricao:** Como usuario, quero adicionar uma foto ao meu produto para identifica-lo visualmente.

**Acceptance Criteria:**

- [ ] Botao "Adicionar foto" no formulario de criacao/edicao de produto
- [ ] Abre opcoes: "Tirar foto" (camera) ou "Escolher da galeria"
- [ ] Usa `expo-image-picker` para captura
- [ ] Faz upload para Supabase Storage (bucket `product-photos`)
- [ ] Salva URL no campo `photoUrl` do produto
- [ ] Mostra preview da foto no formulario e no card do produto
- [ ] Limite de 5MB por foto
- [ ] Typecheck passa

### US-011: Criar bucket de storage no Supabase

**Descricao:** Como desenvolvedor, preciso de um bucket no Supabase Storage para fotos de produtos.

**Acceptance Criteria:**

- [ ] Bucket `product-photos` criado no Supabase
- [ ] Policy: usuarios autenticados podem fazer upload em `{userId}/`
- [ ] Policy: leitura publica para exibir as fotos
- [ ] Limite de 5MB por arquivo
- [ ] Formatos aceitos: jpg, png, webp

---

## User Stories — Gestao de Estoque

### US-012: Gerenciar estoque de produtos

**Descricao:** Como usuario, quero controlar a quantidade em estoque dos meus produtos.

**Acceptance Criteria:**

- [ ] No formulario de criacao/edicao de produto, campos opcionais: "Quantidade em estoque" e "Alerta de estoque baixo"
- [ ] Campos mapeiam para `stockQuantity` e `stockAlertThreshold` (ja existem no schema)
- [ ] Ao registrar uma venda, decrementa automaticamente o estoque dos produtos vendidos
- [ ] Card do produto mostra badge de estoque (ja existe no `ProductCard`: "Sem estoque", "Estoque baixo", "X un.")
- [ ] Typecheck passa

### US-013: Decrementar estoque ao vender

**Descricao:** Como desenvolvedor, preciso que o estoque seja atualizado automaticamente ao criar uma venda.

**Acceptance Criteria:**

- [ ] No `SalesUseCases.create()`, apos criar a venda, decrementa `stockQuantity` de cada produto vendido
- [ ] So decrementa se `stockQuantity` nao for null (produtos sem controle de estoque sao ignorados)
- [ ] Nao permite vender mais do que o estoque disponivel (retorna erro 400)
- [ ] Testes unitarios cobrindo: decremento normal, produto sem estoque habilitado, tentativa de vender acima do estoque
- [ ] Typecheck passa

### US-014: Alerta de estoque baixo na Home

**Descricao:** Como usuario, quero ser avisado quando um produto esta com estoque baixo.

**Acceptance Criteria:**

- [ ] Na Home, secao "Estoque baixo" aparece quando ha produtos com estoque <= threshold
- [ ] Mostra nome do produto e quantidade atual
- [ ] Endpoint `GET /products?lowStock=true` retorna produtos com estoque abaixo do threshold
- [ ] Clicar no alerta navega para o detalhe do produto
- [ ] Typecheck passa

---

## User Stories — DB Trigger Auto-Criar Usuario

### US-015: Trigger para criar usuario automaticamente

**Descricao:** Como desenvolvedor, quero que o registro na tabela `public.users` seja criado automaticamente quando alguem faz signup no Supabase Auth.

**Acceptance Criteria:**

- [ ] Criar funcao PostgreSQL `handle_new_user()` que insere na tabela `public.users`
- [ ] Criar trigger `on_auth_user_created` em `auth.users` AFTER INSERT
- [ ] Funcao extrai: id, email, name (de `raw_user_meta_data`)
- [ ] Plano default: "free"
- [ ] Migration versionada no Supabase
- [ ] Remover workaround do auth middleware (auto-create)
- [ ] Testar: novo signup cria registro em `public.users` automaticamente

---

## User Stories — Pagamento (Preparacao)

### US-016: Preparar infraestrutura de pagamento

**Descricao:** Como desenvolvedor, quero preparar o backend para receber webhooks de pagamento sem depender de um provider especifico.

**Acceptance Criteria:**

- [ ] Criar endpoint `POST /api/v1/subscription/webhook` que recebe eventos de pagamento
- [ ] Endpoint aceita tipos: `subscription.created`, `subscription.renewed`, `subscription.cancelled`, `subscription.expired`
- [ ] Ao receber `subscription.created`/`renewed`: atualiza plano para "premium" com data de expiracao
- [ ] Ao receber `subscription.cancelled`/`expired`: atualiza plano para "free"
- [ ] Endpoint protegido por secret key (header `X-Webhook-Secret`)
- [ ] Testes unitarios para cada tipo de evento
- [ ] Typecheck passa

### US-017: Tela de planos no mobile

**Descricao:** Como usuario, quero ver os planos disponiveis e comparar beneficios.

**Acceptance Criteria:**

- [ ] Criar `apps/mobile/src/app/plans.tsx` como tela stack
- [ ] Mostra plano atual do usuario (Free ou Premium)
- [ ] Comparativo: Free vs Premium (tabela de features)
- [ ] Botao "Assinar Premium" (placeholder — mostra Alert "Em breve")
- [ ] Se ja e premium: mostra data de expiracao e botao "Cancelar assinatura"
- [ ] Acessivel via Settings > "Plano Lucro Caseiro"
- [ ] Typecheck passa

---

## User Stories — Offline Support

### US-018: Cache de leitura offline

**Descricao:** Como usuario, quero ver meus dados mesmo sem internet.

**Acceptance Criteria:**

- [ ] Instalar e configurar `@tanstack/react-query` com `AsyncStorage` como persister
- [ ] Dados carregados ficam em cache e disponiveis offline
- [ ] Ao abrir o app sem internet, mostra dados do cache
- [ ] Indicador visual "Offline" quando sem conexao (banner no topo)
- [ ] Ao reconectar, dados sao revalidados automaticamente
- [ ] Typecheck passa

### US-019: Fila de acoes offline

**Descricao:** Como usuario, quero registrar vendas e cadastros mesmo sem internet.

**Acceptance Criteria:**

- [ ] Criar `OfflineQueue` que armazena mutations em `AsyncStorage`
- [ ] Quando offline: mutations sao salvas na fila com timestamp
- [ ] Quando reconectar: fila e processada em ordem (FIFO)
- [ ] Indicador mostra "X acoes pendentes de sincronizacao"
- [ ] Se mutation falhar ao sincronizar: retry com backoff exponencial (max 3 tentativas)
- [ ] Apos sync completo: invalida queries para atualizar dados
- [ ] Typecheck passa

### US-020: Sync bidirecional

**Descricao:** Como desenvolvedor, preciso garantir que dados offline e online nao conflitem.

**Acceptance Criteria:**

- [ ] Estrategia "last write wins" baseada em timestamp
- [ ] Cada entidade tem `updatedAt` no schema (adicionar migration se necessario)
- [ ] Ao sincronizar: compara `updatedAt` local vs remoto
- [ ] Se remoto e mais recente: descarta mudanca local e mostra notificacao
- [ ] Se local e mais recente: envia para API
- [ ] Logs de sync salvos para debugging
- [ ] Typecheck passa

---

## User Stories — Exportacao PDF/Excel

### US-021: Exportar relatorio financeiro em PDF (API)

**Descricao:** Como usuario, quero exportar meu relatorio financeiro em PDF para compartilhar.

**Acceptance Criteria:**

- [ ] Endpoint `GET /api/v1/finance/export/pdf?month=2026-04` retorna PDF
- [ ] PDF contem: resumo mensal (receita, despesas, lucro), lista de lancamentos, graficos simples
- [ ] Header com nome do negocio e periodo
- [ ] Usar lib `pdfkit` ou `@react-pdf/renderer` no backend
- [ ] Content-Type: `application/pdf`
- [ ] Testes de integracao
- [ ] Typecheck passa

### US-022: Exportar relatorio financeiro em Excel (API)

**Descricao:** Como usuario, quero exportar meus dados financeiros em Excel para analise.

**Acceptance Criteria:**

- [ ] Endpoint `GET /api/v1/finance/export/xlsx?month=2026-04` retorna XLSX
- [ ] Planilha com colunas: Data, Tipo, Categoria, Descricao, Valor
- [ ] Aba de resumo com totais
- [ ] Usar lib `exceljs` no backend
- [ ] Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [ ] Testes de integracao
- [ ] Typecheck passa

### US-023: Botao de exportar no mobile

**Descricao:** Como usuario, quero exportar relatorios diretamente do app.

**Acceptance Criteria:**

- [ ] Na tela de Financeiro, botao "Exportar" com opcoes "PDF" e "Excel"
- [ ] Faz download do arquivo via API
- [ ] Abre Share Sheet do sistema para compartilhar/salvar
- [ ] Usar `expo-file-system` para download e `expo-sharing` para compartilhar
- [ ] Loading state durante geracao
- [ ] Typecheck passa

---

## User Stories — Notificacoes Push

### US-024: Configurar push notifications

**Descricao:** Como desenvolvedor, preciso configurar a infraestrutura de push notifications.

**Acceptance Criteria:**

- [ ] Instalar `expo-notifications`
- [ ] Solicitar permissao do usuario no primeiro uso
- [ ] Salvar push token no backend (`PATCH /subscription/profile` com campo `pushToken`)
- [ ] Adicionar campo `pushToken` na tabela `users` (migration)
- [ ] Typecheck passa

### US-025: Notificacao de vendas pendentes/fiado

**Descricao:** Como usuario, quero ser lembrado de vendas fiado ou pendentes.

**Acceptance Criteria:**

- [ ] Cron job diario (ou Supabase Edge Function) que verifica vendas pendentes > 7 dias
- [ ] Envia push: "Voce tem X vendas pendentes. Confira!"
- [ ] Clicar na notificacao abre a tela de vendas filtrada por "Pendentes"
- [ ] Respeitar toggle de notificacoes do Settings

### US-026: Notificacao de aniversario de clientes

**Descricao:** Como usuario, quero ser avisado no dia do aniversario dos meus clientes.

**Acceptance Criteria:**

- [ ] Cron job diario que verifica aniversarios do dia
- [ ] Envia push: "Hoje e aniversario de [nome]! Que tal enviar uma mensagem?"
- [ ] Clicar na notificacao abre detalhe do cliente
- [ ] Respeitar toggle de notificacoes do Settings

### US-027: Notificacao de estoque baixo

**Descricao:** Como usuario, quero ser avisado quando um produto esta com estoque baixo.

**Acceptance Criteria:**

- [ ] Cron job diario que verifica produtos com estoque <= threshold
- [ ] Envia push: "[produto] esta com estoque baixo (X unidades)"
- [ ] Clicar na notificacao abre detalhe do produto
- [ ] So envia 1x por produto ate que o estoque seja reposto
- [ ] Respeitar toggle de notificacoes do Settings

---

## Functional Requirements

- FR-1: Receitas devem ser editaveis e excluiveis pelo usuario que as criou
- FR-2: Vendas devem ser editaveis (itens, cliente, pagamento) exceto quando canceladas
- FR-3: Historico de compras de um cliente deve usar o filtro `clientId` ja existente na API de vendas
- FR-4: Tela de rotulos deve ser acessivel via menu "Mais" e listar rotulos com preview
- FR-5: Busca de vendas deve funcionar em conjunto com filtros de status
- FR-6: Tags de cliente devem ser editaveis via chips com max 10 tags de 50 chars
- FR-7: Foto de produto deve ser armazenada no Supabase Storage com limite de 5MB
- FR-8: Estoque deve ser decrementado automaticamente ao registrar venda
- FR-9: Venda nao deve ser permitida se estoque insuficiente (enforcement no backend)
- FR-10: DB trigger deve criar registro em `public.users` ao signup no Supabase Auth
- FR-11: Webhook de pagamento deve aceitar eventos de subscription lifecycle
- FR-12: Cache offline deve persistir entre sessoes do app via AsyncStorage
- FR-13: Fila offline deve processar mutations em ordem FIFO ao reconectar
- FR-14: Conflitos de sync resolvidos por "last write wins" com timestamp
- FR-15: Exportacao PDF deve incluir resumo + lista de lancamentos + header com negocio
- FR-16: Exportacao Excel deve ter colunas claras e aba de resumo
- FR-17: Push notifications devem respeitar toggle de preferencia do usuario
- FR-18: Todas as queries devem ser escopadas por userId (seguranca)
- FR-19: Todos os novos campos devem ter migrations versionadas

## Non-Goals (Out of Scope)

- Integracao com provider de pagamento especifico (RevenueCat/Stripe) — apenas infraestrutura preparada
- Chat/mensagens dentro do app
- Multi-usuario / equipe (apenas 1 usuario por conta)
- Marketplace de produtos
- Integracao com delivery (iFood, Rappi)
- Relatorios graficos avancados (apenas tabelas e listas)
- Modo tablet / iPad otimizado
- Internacionalizacao (apenas pt-BR)
- Backup/restore manual de dados

## Design Considerations

- Reutilizar componentes existentes: `Card`, `Button`, `Input`, `Typography`, `Badge`, `EmptyState` do `@lucro-caseiro/ui`
- Modais para edicao (padrao ja estabelecido no app)
- Chips/tags usar componente customizado com `Pressable` + `Badge`
- Upload de foto usar `expo-image-picker` com crop
- Banner offline usar `View` fixa no topo com cor de alerta
- Exportacao usar Share Sheet nativa via `expo-sharing`
- Notificacoes usar `expo-notifications` com deep linking

## Technical Considerations

- **Offline**: `@tanstack/react-query-persist-client` com `createAsyncStoragePersister`
- **Connectivity**: `@react-native-community/netinfo` para detectar estado de rede
- **PDF**: `pdfkit` no backend (Node.js stream)
- **Excel**: `exceljs` no backend
- **Storage**: Supabase Storage para fotos de produto
- **Push**: `expo-notifications` + Supabase Edge Functions para cron jobs
- **Sync**: `updatedAt` em todas as tabelas, comparacao de timestamps
- **Webhook**: endpoint separado com autenticacao por secret key
- **Migrations**: usar `drizzle-kit` para gerenciar schema changes

## Success Metrics

- 100% das features listadas implementadas e testando (typecheck + testes)
- Edicao de receita/venda funcional em < 3 toques
- Historico de compras carrega em < 1 segundo
- App funciona offline por pelo menos 24h sem perda de dados
- Exportacao PDF/Excel gera arquivo em < 5 segundos
- Push notifications entregues em < 1 minuto do trigger
- Zero regressoes nos 284 testes unitarios e 53 de integracao existentes

## Open Questions

1. Qual provider de pagamento sera escolhido? (RevenueCat vs Stripe vs outro)
2. Supabase Edge Functions sao suficientes para cron jobs de notificacao ou precisamos de um servico externo?
3. O sync bidirecional justifica a complexidade para a v1 ou deveriamos comecar com cache read-only?
4. Fotos de produto devem ter compressao automatica no upload?
5. Exportacao deve incluir vendas ou apenas financeiro?
6. Limite de armazenamento de fotos no plano free?
