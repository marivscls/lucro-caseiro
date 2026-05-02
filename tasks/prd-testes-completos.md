# PRD: Testes Completos — 11 Epicos do Lucro Caseiro

## Introducao

Este PRD define a suite de testes necessaria para garantir 100% de funcionalidade dos 11 epicos implementados no Lucro Caseiro. Cobre testes unitarios, de integracao e de UI, com cobertura maxima de cenarios incluindo edge cases, erros e cenarios negativos.

**Stack de testes:**

- **API:** Vitest + mocks via interfaces (`IXxxRepo`)
- **Mobile:** Vitest + `@testing-library/react-native`
- **Padrao:** AAA (Arrange / Act / Assert), SUT factory, fixtures claros
- **SDKs nativos (AdMob, RevenueCat, expo-image-picker):** pular testes que dependem de SDKs nativos — testar manualmente em dispositivo
- **Sem snapshot tests** — apenas testes comportamentais

---

## Goals

- Garantir que todos os 11 epicos funcionam corretamente em todos os cenarios (sucesso, falha, edge case)
- Cobrir toda logica de dominio pura com testes unitarios
- Cobrir todos os usecases com testes unitarios (mocks via interfaces)
- Cobrir todos os endpoints novos da API com testes de integracao (mocks, sem banco real)
- Cobrir todos os hooks novos do mobile com testes unitarios
- Cobrir todos os componentes/telas novos com testes de UI (renderizar + interacao + fluxo completo)
- Manter zero regressao nos testes existentes
- Typecheck e lint passando em toda a suite

---

## Epico 1: Testes de Anuncios (AdMob)

### US-T101: Testes unitarios de interleaveAds()

**Descricao:** Como desenvolvedor, preciso testar a funcao utilitaria que intercala ads na lista de itens.

**Arquivo:** `apps/mobile/src/shared/components/ad-banner.test.ts`

**Criterios de Aceite:**

- [ ] Lista com menos de 5 itens retorna a lista original sem ads
- [ ] Lista com 5 itens nao insere ads (boundary)
- [ ] Lista com 8 itens insere 1 ad marker na posicao 8
- [ ] Lista com 16 itens insere 2 ad markers (posicoes 8 e 16)
- [ ] Lista com 20 itens insere ads a cada 8 itens
- [ ] Intervalo customizado (ex: 4) funciona corretamente
- [ ] AD_ITEM_MARKER e uma string constante reconhecivel
- [ ] Lista vazia retorna lista vazia
- [ ] Lista com exatamente 8 itens insere 0 ad markers (ad so entre itens, nao no final)
- [ ] Typecheck passa

### US-T102: Testes unitarios de useShowAds()

**Descricao:** Como desenvolvedor, preciso testar que o hook retorna true para free e false para premium.

**Arquivo:** `apps/mobile/src/shared/hooks/use-show-ads.test.ts`

**Criterios de Aceite:**

- [ ] Retorna `true` quando `profile.plan === "free"`
- [ ] Retorna `false` quando `profile.plan === "premium"`
- [ ] Retorna `true` quando profile e `undefined` (loading state)
- [ ] Retorna `true` quando profile e `null` (erro de fetch)
- [ ] Atualiza reatividade quando plan muda de free para premium
- [ ] Mock do `useProfile()` via module mock
- [ ] Typecheck passa

### US-T103: Testes unitarios de useInterstitial()

**Descricao:** Como desenvolvedor, preciso testar a logica de frequency capping do intersticial.

**Arquivo:** `apps/mobile/src/shared/hooks/use-interstitial.test.ts`

**Criterios de Aceite:**

- [ ] `show()` nao faz nada quando `useShowAds()` retorna false (usuario premium)
- [ ] `show()` nao faz nada quando chamado dentro do frequency cap de 3 minutos
- [ ] `show()` tenta carregar ad quando fora do frequency cap
- [ ] Quando SDK nao esta instalado (require falha), `show()` nao lanca erro
- [ ] Frequency cap reseta apos 3 minutos (usar `vi.useFakeTimers()`)
- [ ] Typecheck passa

---

## Epico 2: Testes de Planos / Pagamento

### US-T201: Testes unitarios do webhook handler (dominio)

**Descricao:** Como desenvolvedor, preciso testar toda a logica do webhook do RevenueCat.

**Arquivo:** `apps/api/src/features/subscription/webhook.routes.test.ts`

**Criterios de Aceite:**

- [ ] Evento `INITIAL_PURCHASE` chama `activatePremium(userId, expiresAt)`
- [ ] Evento `RENEWAL` chama `activatePremium(userId, expiresAt)`
- [ ] Evento `PRODUCT_CHANGE` chama `activatePremium(userId, expiresAt)`
- [ ] Evento `CANCELLATION` chama `deactivatePremium(userId)`
- [ ] Evento `EXPIRATION` chama `deactivatePremium(userId)`
- [ ] Evento `BILLING_ISSUE_DETECTED` nao chama activate nem deactivate (apenas loga)
- [ ] Evento `TEST` retorna 200 sem alterar dados
- [ ] Evento com tipo desconhecido retorna 200 sem alterar dados
- [ ] Request sem `Authorization` header retorna 401 (quando secret configurado)
- [ ] Request com secret invalido retorna 401
- [ ] Request com secret valido retorna 200
- [ ] Request sem secret configurado (vazio) aceita qualquer request
- [ ] Body sem `event` retorna 400
- [ ] Body sem `event.app_user_id` retorna 400
- [ ] `expiresAt` null quando `expiration_at_ms` e null
- [ ] `expiresAt` convertido corretamente de ms para Date
- [ ] Mock do `SubscriptionUseCases` via interface
- [ ] Typecheck passa

### US-T202: Testes do endpoint sync-plan

**Descricao:** Como desenvolvedor, preciso testar o endpoint POST /sync-plan.

**Arquivo:** `apps/api/src/features/subscription/subscription.routes.test.ts` (adicionar)

**Criterios de Aceite:**

- [ ] `plan: "premium"` chama `activatePremium(userId, expiresAt)`
- [ ] `plan: "free"` chama `deactivatePremium(userId)`
- [ ] `expiresAt: null` e tratado corretamente
- [ ] `expiresAt` como string ISO e convertido para Date
- [ ] Endpoint requer autenticacao (sem token retorna 401)
- [ ] Retorna o perfil atualizado no body
- [ ] Typecheck passa

### US-T203: Testes unitarios de useSubscription() (sem SDK)

**Descricao:** Como desenvolvedor, preciso testar a logica do hook de assinatura sem depender do RevenueCat SDK.

**Arquivo:** `apps/mobile/src/features/subscription/use-subscription.test.ts`

**Criterios de Aceite:**

- [ ] `subscribe()` mostra alert "Em breve" quando SDK nao esta disponivel
- [ ] `restore()` mostra alert de erro quando SDK nao esta disponivel
- [ ] `loading` inicia como false
- [ ] Quando `token` e null, funcoes nao tentam chamar API
- [ ] Typecheck passa

### US-T204: Testes de UI da Paywall

**Descricao:** Como desenvolvedor, preciso testar que a paywall renderiza corretamente e responde a interacoes.

**Arquivo:** `apps/mobile/src/features/subscription/components/paywall.test.tsx`

**Criterios de Aceite:**

- [ ] Renderiza titulo default "Seu negocio merece mais!"
- [ ] Renderiza titulo custom quando prop `title` e passada
- [ ] Renderiza mensagem custom quando prop `message` e passada
- [ ] Renderiza currentUsage quando passado
- [ ] Exibe todos os 9 beneficios (incluindo "Sem anuncios")
- [ ] Exibe seletor de plano mensal e anual
- [ ] Plano mensal selecionado por default (borda premium)
- [ ] Clicar no plano anual muda selecao (borda premium muda)
- [ ] Exibe selo "-33%" no plano anual
- [ ] Exibe texto "7 dias gratis para experimentar. Cancele quando quiser."
- [ ] Botao "Comecar teste gratis" esta presente
- [ ] Link "Restaurar compra anterior" esta presente
- [ ] Botao "Agora nao" esta presente quando `onClose` e passado
- [ ] Botao "Agora nao" nao aparece quando `onClose` nao e passado
- [ ] Clicar "Agora nao" chama `onClose()`
- [ ] Typecheck passa

---

## Epico 3: Testes de Produtos (Image Picker)

### US-T301: Testes unitarios de useImagePicker() (sem SDK)

**Descricao:** Como desenvolvedor, preciso testar a logica do hook de image picker.

**Arquivo:** `apps/mobile/src/shared/hooks/use-image-picker.test.ts`

**Criterios de Aceite:**

- [ ] `imageUri` inicia como null
- [ ] `setImageUri("test.jpg")` atualiza o estado
- [ ] `clear()` reseta imageUri para null
- [ ] `showPicker()` chama `Alert.alert` com 3 opcoes (Tirar foto, Escolher da galeria, Cancelar)
- [ ] Typecheck passa

### US-T302: Testes de UI do CreateProductForm com foto

**Descricao:** Como desenvolvedor, preciso testar que o formulario de produto exibe o picker de foto corretamente.

**Arquivo:** `apps/mobile/src/features/products/components/create-product-form.test.tsx`

**Criterios de Aceite:**

- [ ] Renderiza label "Foto do produto"
- [ ] Renderiza area clicavel com icone de camera e texto "Adicionar"
- [ ] Nao renderiza tag `<Image>` quando nenhuma foto selecionada
- [ ] Campos obrigatorios: nome vazio mostra alert "Opa!"
- [ ] Categoria vazia mostra alert "Opa!"
- [ ] Preco zero ou negativo mostra alert "Opa!"
- [ ] Preco com virgula (ex: "3,50") e convertido corretamente para 3.5
- [ ] Submit com dados validos chama `createProduct.mutateAsync`
- [ ] Alert de sucesso exibe nome do produto
- [ ] `onSuccess` callback e chamado apos criacao
- [ ] Typecheck passa

### US-T303: Testes de fluxo completo da tela de Produtos

**Descricao:** Como desenvolvedor, preciso testar o fluxo: abrir lista → clicar produto → ver detalhe → editar → salvar.

**Arquivo:** `apps/mobile/src/app/products.test.tsx`

**Criterios de Aceite:**

- [ ] Lista de produtos renderiza corretamente com dados mockados
- [ ] Clicar no FAB "+ Novo produto" abre modal de criacao
- [ ] Clicar em um produto abre modal de detalhe
- [ ] Modal de detalhe exibe: nome, categoria, preco, descricao
- [ ] Clicar "Editar" no detalhe muda para modo edicao
- [ ] Modo edicao exibe campos pre-preenchidos
- [ ] Clicar "Salvar" no modo edicao chama updateProduct
- [ ] Clicar "Excluir" abre confirmacao
- [ ] Confirmar exclusao chama deleteProduct e fecha modal
- [ ] Cancelar exclusao nao chama deleteProduct
- [ ] Clicar "Fechar" fecha o modal
- [ ] Typecheck passa

---

## Epico 4: Testes de Embalagens

### US-T401: Testes de fluxo completo da tela de Embalagens

**Descricao:** Como desenvolvedor, preciso testar: lista → criar → detalhe → editar → excluir.

**Arquivo:** `apps/mobile/src/app/packaging.test.tsx`

**Criterios de Aceite:**

- [ ] Empty state exibe "Nenhuma embalagem ainda" com botao de cadastrar
- [ ] Lista exibe embalagens com nome, custo, tipo (badge)
- [ ] Custo exibido no formato "R$ X,XX"
- [ ] Fornecedor aparece ao lado do custo separado por " · "
- [ ] Clicar no FAB abre modal de criacao
- [ ] Modal de criacao tem campos: nome, tipo (chips), custo, fornecedor
- [ ] Chips de tipo: Caixa, Sacola, Pote, Filme, Rotulo, Outro
- [ ] Validacao: nome vazio mostra alert
- [ ] Validacao: custo zero mostra alert
- [ ] Criacao bem-sucedida mostra alert e fecha modal
- [ ] Clicar em uma embalagem abre modal de detalhe
- [ ] Detalhe exibe: nome, tipo (badge), custo, fornecedor
- [ ] Clicar "Editar" abre formulario pre-preenchido
- [ ] Edicao atualiza dados e mostra alert de sucesso
- [ ] Clicar "Excluir" abre confirmacao
- [ ] Confirmar exclusao fecha modal
- [ ] Typecheck passa

---

## Epico 5: Testes de Rotulos

### US-T501: Testes de fluxo completo da tela de Rotulos

**Descricao:** Como desenvolvedor, preciso testar: lista → criar → detalhe → editar → excluir.

**Arquivo:** `apps/mobile/src/app/labels.test.tsx`

**Criterios de Aceite:**

- [ ] Empty state exibe "Nenhum rotulo ainda" com botao de criar
- [ ] Lista exibe rotulos com nome, template, data de criacao
- [ ] Data formatada em pt-BR (DD/MM/AAAA)
- [ ] Clicar no FAB abre modal de criacao
- [ ] Modal de criacao tem: nome, template picker, campos do rotulo, preview
- [ ] Clicar em um rotulo abre modal de detalhe
- [ ] Detalhe exibe: nome, template, data, LabelPreview em escala 1.2
- [ ] Clicar "Editar" abre formulario pre-preenchido com todos os campos
- [ ] Formulario de edicao mostra TemplatePicker com template atual selecionado
- [ ] Formulario de edicao mostra LabelPreview atualizado em tempo real
- [ ] Edicao salva dados e mostra alert de sucesso
- [ ] Clicar "Excluir" abre confirmacao
- [ ] Confirmar exclusao fecha modal
- [ ] Typecheck passa

---

## Epico 6: Testes de Edicao de Vendas

### US-T601: Testes de UI do SaleDetail com botao Editar

**Descricao:** Como desenvolvedor, preciso testar que o SaleDetail exibe o botao de editar corretamente.

**Arquivo:** `apps/mobile/src/features/sales/components/sale-detail.test.tsx`

**Criterios de Aceite:**

- [ ] Botao "Editar venda" aparece quando `sale.status !== "cancelled"` e `onEditPress` e passado
- [ ] Botao "Editar venda" NAO aparece quando `sale.status === "cancelled"`
- [ ] Botao "Editar venda" NAO aparece quando `onEditPress` nao e passado
- [ ] Clicar "Editar venda" chama `onEditPress()`
- [ ] Botao "Marcar como pago" aparece quando `status === "pending"`
- [ ] Botao "Marcar como pago" NAO aparece quando `status === "paid"`
- [ ] Botao "Cancelar venda" aparece quando `status !== "cancelled"`
- [ ] Botao "Cancelar venda" NAO aparece quando `status === "cancelled"`
- [ ] Clicar "Marcar como pago" abre confirmacao
- [ ] Clicar "Cancelar venda" abre confirmacao
- [ ] Exibe todos os itens com nome, quantidade, preco unitario e subtotal
- [ ] Exibe total da venda
- [ ] Exibe cliente ("Cliente avulso" se null)
- [ ] Exibe forma de pagamento com badge
- [ ] Exibe data formatada em pt-BR
- [ ] Exibe notas quando presentes
- [ ] Typecheck passa

### US-T602: Testes do hook useUpdateSale()

**Descricao:** Como desenvolvedor, preciso testar o hook de atualizacao de vendas.

**Arquivo:** `apps/mobile/src/features/sales/hooks.test.ts`

**Criterios de Aceite:**

- [ ] `mutateAsync` chama `updateSale(token, id, data)` com parametros corretos
- [ ] Apos sucesso, invalida queries com key `["sales"]`
- [ ] Retorna isPending como true durante mutacao
- [ ] Typecheck passa

### US-T603: Testes de fluxo de edicao na tela de Vendas

**Descricao:** Como desenvolvedor, preciso testar o fluxo: lista → detalhe → editar → salvar.

**Arquivo:** `apps/mobile/src/app/tabs/sales.test.tsx`

**Criterios de Aceite:**

- [ ] Clicar em uma venda abre modal de detalhe
- [ ] Clicar "Editar venda" no detalhe abre modal de edicao
- [ ] Modal de edicao exibe chips de forma de pagamento
- [ ] Forma de pagamento atual esta pre-selecionada
- [ ] Clicar em outra forma de pagamento muda selecao
- [ ] Campo de observacoes pre-preenchido com notas atuais
- [ ] Clicar "Salvar alteracoes" chama updateSale com dados corretos
- [ ] Apos salvar com sucesso, modal fecha e exibe alert
- [ ] Clicar "Cancelar" fecha modal sem salvar
- [ ] Typecheck passa

---

## Epico 7: Testes de Historico de Precificacao

### US-T701: Testes de fluxo do historico de precificacao

**Descricao:** Como desenvolvedor, preciso testar o fluxo: abrir pricing → clicar historico → selecionar produto → ver calculos.

**Arquivo:** `apps/mobile/src/app/pricing.test.tsx`

**Criterios de Aceite:**

- [ ] Botao "Historico" com icone de relogio esta presente na tela
- [ ] Clicar "Historico" abre modal
- [ ] Modal exibe chips horizontais com nomes dos produtos
- [ ] Antes de selecionar produto, exibe "Selecione um produto"
- [ ] Clicar em um produto carrega historico (loading indicator)
- [ ] Historico vazio exibe "Nenhum calculo encontrado"
- [ ] Historico com dados exibe: data, preco sugerido, custo total, margem
- [ ] Data formatada em pt-BR
- [ ] Precos formatados como "R$ X,XX"
- [ ] Margem exibida como "X%"
- [ ] Clicar "Fechar" fecha o modal
- [ ] Typecheck passa

---

## Epico 8: Testes de Alertas de Estoque Baixo

### US-T801: Testes do endpoint GET /products/low-stock

**Descricao:** Como desenvolvedor, preciso testar a logica de filtragem e ordenacao de produtos com estoque baixo.

**Arquivo:** `apps/api/src/features/products/products.routes.test.ts` (adicionar)

**Criterios de Aceite:**

- [ ] Retorna apenas produtos onde `stockQuantity <= stockAlertThreshold`
- [ ] Ignora produtos onde `stockQuantity` ou `stockAlertThreshold` e null
- [ ] Ordena por estoque: zerado primeiro, depois menor estoque
- [ ] Produto com stockQuantity=0 aparece antes de stockQuantity=3
- [ ] Produto sem estoque tracking (null) nao aparece
- [ ] Produto com estoque acima do limiar nao aparece
- [ ] Produto inativo (soft deleted) nao aparece
- [ ] Endpoint requer autenticacao
- [ ] Retorna array vazio quando nenhum produto tem estoque baixo
- [ ] Scoped por userId (nao retorna produtos de outro usuario)
- [ ] Typecheck passa

### US-T802: Testes de UI da secao de estoque baixo no Dashboard

**Descricao:** Como desenvolvedor, preciso testar que a secao de alertas aparece corretamente no dashboard.

**Arquivo:** `apps/mobile/src/app/tabs/index.test.tsx`

**Criterios de Aceite:**

- [ ] Secao "Estoque baixo" NAO aparece quando nao ha produtos com estoque baixo
- [ ] Secao "Estoque baixo" NAO aparece quando `lowStockProducts` e undefined (loading)
- [ ] Secao "Estoque baixo" aparece com borda vermelha a esquerda
- [ ] Titulo "Estoque baixo" em cor alert
- [ ] Exibe ate 5 produtos com nome e quantidade
- [ ] Produto com stockQuantity=0 exibe "Sem estoque" em cor alert
- [ ] Produto com stockQuantity>0 exibe "X un." em cor premium
- [ ] Quando ha mais de 5 produtos, exibe link "Ver todos (N)"
- [ ] Clicar "Ver todos" navega para /products
- [ ] Typecheck passa

---

## Epico 9: Testes de Notificacoes Push

### US-T901: Testes de handleNotificationResponse()

**Descricao:** Como desenvolvedor, preciso testar o roteamento correto ao clicar em cada tipo de notificacao.

**Arquivo:** `apps/mobile/src/shared/hooks/notification-types.test.ts`

**Criterios de Aceite:**

- [ ] Tipo `PENDING_SALES` navega para `/tabs`
- [ ] Tipo `CLIENT_BIRTHDAY` navega para `/tabs/clients`
- [ ] Tipo `LOW_STOCK` navega para `/products`
- [ ] Tipo `WEEKLY_SUMMARY` navega para `/finance`
- [ ] Tipo `DAILY_REMINDER` navega para `/finance`
- [ ] Tipo `TRIAL_EXPIRING` navega para `/plans`
- [ ] Tipo undefined (sem data.type) nao navega
- [ ] Data undefined nao navega (nao lanca erro)
- [ ] Mock do `router.push()` via module mock de expo-router
- [ ] Typecheck passa

### US-T902: Testes de UI dos toggles de notificacao no Settings

**Descricao:** Como desenvolvedor, preciso testar que os toggles individuais de notificacao aparecem corretamente.

**Arquivo:** `apps/mobile/src/app/settings.test.tsx`

**Criterios de Aceite:**

- [ ] Exibe 5 toggles de notificacao: "Vendas pendentes", "Aniversarios de clientes", "Estoque baixo", "Resumo semanal", "Lembretes diarios"
- [ ] Cada toggle e um Switch com valor inicial true
- [ ] Cada toggle tem label de texto associado
- [ ] Secao de notificacoes esta dentro do card "Preferencias"
- [ ] Botao "Restaurar compra anterior" aparece quando usuario nao e premium
- [ ] Botao "Restaurar compra anterior" NAO aparece quando usuario e premium
- [ ] Typecheck passa

---

## Epico 10: Testes de Modo Offline

### US-T1001: Testes unitarios de useOfflineQueue

**Descricao:** Como desenvolvedor, preciso testar toda a logica da fila offline.

**Arquivo:** `apps/mobile/src/shared/hooks/use-offline-queue.test.ts`

**Criterios de Aceite:**

- [ ] `operations` inicia como array vazio
- [ ] `isSyncing` inicia como false
- [ ] `enqueue()` adiciona operacao com id unico, createdAt, status "pending", retries 0
- [ ] `enqueue()` respeita limite de 100 operacoes (nao adiciona alem do limite)
- [ ] `enqueue()` gera ids diferentes para operacoes diferentes
- [ ] `dequeue(id)` remove operacao pelo id
- [ ] `dequeue(id)` nao faz nada se id nao existir
- [ ] `markFailed(id)` muda status para "failed" e incrementa retries
- [ ] `markFailed(id)` incrementa retries corretamente em chamadas consecutivas
- [ ] `setSyncing(true)` atualiza isSyncing
- [ ] `clear()` remove todas as operacoes
- [ ] Operacao enfileirada tem campos corretos: method, endpoint, payload
- [ ] Typecheck passa

### US-T1002: Testes unitarios de processOfflineQueue()

**Descricao:** Como desenvolvedor, preciso testar o processamento da fila offline.

**Arquivo:** `apps/mobile/src/shared/hooks/use-offline-queue.test.ts` (mesmo arquivo)

**Criterios de Aceite:**

- [ ] Retorna `{ synced: 0, failed: 0 }` quando fila esta vazia
- [ ] Processa operacoes pendentes em ordem FIFO
- [ ] Operacao com sucesso e removida da fila (dequeue)
- [ ] Operacao com falha e marcada como failed (markFailed)
- [ ] Operacao com 3+ retries nao e processada novamente
- [ ] `isSyncing` e true durante processamento e false apos
- [ ] Retorna contagem correta de synced e failed
- [ ] Todas as operacoes pendentes sao tentadas (nao para no primeiro erro)
- [ ] Mock do `apiClient` para simular sucesso e falha
- [ ] Typecheck passa

### US-T1003: Testes de setupAutoSync()

**Descricao:** Como desenvolvedor, preciso testar que o auto-sync e disparado ao reconectar.

**Arquivo:** `apps/mobile/src/shared/hooks/use-offline-queue.test.ts` (mesmo arquivo)

**Criterios de Aceite:**

- [ ] Retorna funcao de unsubscribe
- [ ] Quando rede muda de offline para online, chama processOfflineQueue
- [ ] Quando rede muda de online para online, NAO chama processOfflineQueue
- [ ] Quando rede muda de online para offline, NAO chama processOfflineQueue
- [ ] Quando token e null, NAO chama processOfflineQueue
- [ ] Unsubscribe remove o listener
- [ ] Typecheck passa

### US-T1004: Testes de UI do OfflineBanner

**Descricao:** Como desenvolvedor, preciso testar todas as variacoes visuais do banner.

**Arquivo:** `apps/mobile/src/shared/components/offline-banner.test.tsx`

**Criterios de Aceite:**

- [ ] NAO renderiza quando online, nao syncing, sem operacoes pendentes
- [ ] Renderiza "Voce esta offline. Dados podem estar desatualizados." quando offline sem pendentes
- [ ] Renderiza "Voce esta offline. 3 alteracao(oes) pendente(s)." quando offline com 3 pendentes
- [ ] Renderiza "Sincronizando dados..." quando isSyncing e true
- [ ] Renderiza "Sincronizando 2 alteracao(oes)..." quando online com 2 pendentes
- [ ] Banner offline tem backgroundColor alertBg
- [ ] Banner syncing tem backgroundColor premiumBg
- [ ] Typecheck passa

---

## Epico 11: Testes de Correcoes de UI

### US-T1101: Testes de regressao da tela de Clientes

**Descricao:** Como desenvolvedor, preciso garantir que a tela de clientes funciona sem stubs.

**Arquivo:** `apps/mobile/src/app/tabs/clients.test.tsx`

**Criterios de Aceite:**

- [ ] Lista de clientes renderiza com busca funcional
- [ ] Clicar em um cliente abre detalhe
- [ ] Detalhe exibe botao "Editar" que abre modal de edicao
- [ ] Modal de edicao pre-preenche dados do cliente
- [ ] FAB abre modal de criacao
- [ ] Botao "Voltar" no detalhe retorna para lista
- [ ] Typecheck passa

### US-T1102: Testes de regressao do Dashboard

**Descricao:** Como desenvolvedor, preciso garantir que o dashboard renderiza todas as secoes.

**Arquivo:** `apps/mobile/src/app/tabs/index.test.tsx` (mesmo arquivo do US-T802)

**Criterios de Aceite:**

- [ ] Header exibe "Hoje" e data formatada
- [ ] Botoes rapidos "Venda" e "Cliente" navegam corretamente
- [ ] Quick access horizontal scroll com 8 itens
- [ ] Card "Vendas de Hoje" exibe total e contagem
- [ ] Card mensal exibe Entradas, Saidas, Lucro
- [ ] Lucro positivo em cor success, negativo em cor alert
- [ ] Secao de aniversariantes aparece quando ha dados
- [ ] Secao de estoque baixo aparece quando ha dados (US-T802)
- [ ] AdBanner renderiza no final (para usuarios free)
- [ ] LimitBanner de vendas esta presente
- [ ] Loading state exibe ActivityIndicator
- [ ] Typecheck passa

### US-T1103: Verificacao de imports nao usados

**Descricao:** Como desenvolvedor, preciso garantir que nao ha imports nao usados em nenhum arquivo modificado.

**Arquivo:** Nao e um arquivo de teste — e uma verificacao via lint.

**Criterios de Aceite:**

- [ ] `pnpm lint` no mobile passa sem erros de unused imports
- [ ] `pnpm lint` na API passa sem erros (apenas warnings pre-existentes)
- [ ] `pnpm typecheck` no mobile passa sem erros
- [ ] `pnpm typecheck` na API passa sem erros
- [ ] Typecheck passa

---

## Requisitos Funcionais (Consolidado)

- FR-T1: Cada funcao utilitaria pura (interleaveAds, handleNotificationResponse) deve ter 100% de branch coverage
- FR-T2: Cada hook novo deve ter testes para estado inicial, transicoes de estado e edge cases
- FR-T3: Cada endpoint novo da API deve ter testes para sucesso, validacao, autorizacao e erros
- FR-T4: Cada tela/componente novo do mobile deve ter testes de renderizacao e interacao
- FR-T5: Fluxos completos (lista → detalhe → editar → salvar) devem ser testados end-to-end no nivel de UI
- FR-T6: Todos os testes devem usar o padrao AAA (Arrange / Act / Assert)
- FR-T7: Mocks devem ser feitos via interfaces (IXxxRepo) para API e via module mocks para mobile
- FR-T8: Testes nao devem depender de SDKs nativos (AdMob, RevenueCat, expo-image-picker) — essas integracoes devem ser testadas manualmente
- FR-T9: Todos os testes devem passar em CI (pnpm test)
- FR-T10: Zero regressao nos testes existentes (284 unit + 53 integration na API)

## Non-Goals (Fora de Escopo)

- Testes E2E com Detox ou Maestro (complexidade de setup)
- Testes visuais com screenshot comparison
- Snapshot tests (decisao do usuario)
- Testes de performance (load testing)
- Testes de SDKs nativos (AdMob, RevenueCat, expo-image-picker) — testar manualmente
- Testes de push notifications reais (requerem dispositivo fisico)
- Testes de dark mode vs light mode
- Testes de acessibilidade automatizados (WCAG)
- Testes de banco de dados real (PostgreSQL) — usar mocks via interfaces

## Consideracoes Tecnicas

### Setup de testes mobile

- Instalar `@testing-library/react-native` e `@testing-library/jest-native` se nao instalados
- Configurar mocks globais para: `expo-router` (router.push, useRouter), `react-native-safe-area-context`, `@lucro-caseiro/ui` (ThemeProvider, useTheme)
- Criar `test-utils.tsx` com wrapper que inclui QueryClientProvider + ThemeProvider para testes de hooks e componentes
- Mock do `useAuth` retornando `{ token: "test-token", userId: "test-user", isAuthenticated: true }`

### Setup de testes API

- Manter padrao existente: mocks via interfaces (ISubscriptionRepo, ISalesRepo, IProductsRepo)
- SUT factory para cada usecase testado
- Fixtures tipadas para cada entidade (Sale, Product, Packaging, Label, etc.)

### Organizacao de arquivos de teste

- Testes ficam ao lado do arquivo testado: `foo.ts` → `foo.test.ts`
- Testes de tela ficam ao lado da tela: `products.tsx` → `products.test.tsx`
- Shared test utils em `apps/mobile/src/test/` e `apps/api/src/test/`

### Execucao

- `pnpm test` — roda todos os testes (API + mobile)
- `pnpm test --filter @lucro-caseiro/api` — apenas API
- `pnpm test --filter @lucro-caseiro/mobile` — apenas mobile
- CI roda `pnpm test` como parte do gate

## Metricas de Sucesso

- **Zero testes falhando** em CI apos implementacao
- **Zero regressao** nos 337 testes existentes (284 unit + 53 integration)
- **100% dos hooks novos** com testes (8 hooks)
- **100% dos endpoints novos** com testes (3 endpoints)
- **100% dos componentes/telas novos** com testes de UI (10+ componentes)
- **100% das funcoes utilitarias** com testes (interleaveAds, handleNotificationResponse)
- **Branch coverage > 90%** para logica de dominio pura
- **Todos os fluxos criticos** cobertos: criar/editar/excluir para Embalagens, Rotulos, Vendas; fila offline; paywall

## Open Questions

1. **@testing-library/react-native** ja esta instalado no projeto? Se nao, precisa ser adicionado como devDependency.
2. **Mock global de expo-router** — existe um setup file de teste ja configurado, ou precisa ser criado do zero?
3. **Fixtures compartilhadas** — criar um pacote `@lucro-caseiro/test-fixtures` ou manter fixtures em cada app?
4. **CI timeout** — os testes de UI do mobile podem ser lentos. Qual o timeout maximo aceitavel para CI?
5. **Cobertura minima** — definir threshold no vitest.config.ts (ex: `coverage: { branches: 90, functions: 90 }`) ou nao?

## Estimativa de Arquivos de Teste

| Arquivo de teste               | Epico | Tipo       | Stories           |
| ------------------------------ | ----- | ---------- | ----------------- |
| `ad-banner.test.ts`            | 1     | Unit       | US-T101           |
| `use-show-ads.test.ts`         | 1     | Unit       | US-T102           |
| `use-interstitial.test.ts`     | 1     | Unit       | US-T103           |
| `webhook.routes.test.ts`       | 2     | Unit       | US-T201           |
| `subscription.routes.test.ts`  | 2     | Unit       | US-T202           |
| `use-subscription.test.ts`     | 2     | Unit       | US-T203           |
| `paywall.test.tsx`             | 2     | UI         | US-T204           |
| `use-image-picker.test.ts`     | 3     | Unit       | US-T301           |
| `create-product-form.test.tsx` | 3     | UI         | US-T302           |
| `products.test.tsx`            | 3     | UI+Flow    | US-T303           |
| `packaging.test.tsx`           | 4     | UI+Flow    | US-T401           |
| `labels.test.tsx`              | 5     | UI+Flow    | US-T501           |
| `sale-detail.test.tsx`         | 6     | UI         | US-T601           |
| `sales-hooks.test.ts`          | 6     | Unit       | US-T602           |
| `sales.test.tsx`               | 6     | UI+Flow    | US-T603           |
| `pricing.test.tsx`             | 7     | UI+Flow    | US-T701           |
| `products.routes.test.ts`      | 8     | Unit       | US-T801           |
| `index.test.tsx`               | 8+11  | UI         | US-T802, US-T1102 |
| `notification-types.test.ts`   | 9     | Unit       | US-T901           |
| `settings.test.tsx`            | 9     | UI         | US-T902           |
| `use-offline-queue.test.ts`    | 10    | Unit+Integ | US-T1001-T1003    |
| `offline-banner.test.tsx`      | 10    | UI         | US-T1004          |
| `clients.test.tsx`             | 11    | UI+Flow    | US-T1101          |

**Total: 23 arquivos de teste, 23 user stories, ~200+ criterios de aceite**
