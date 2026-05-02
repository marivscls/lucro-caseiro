# PRD: Lucro Caseiro — Funcionalidades Restantes (Completo)

## Introducao

Este PRD cobre **todas** as funcionalidades que faltam para o Lucro Caseiro atingir a versao 1.0 completa. O app e uma ferramenta de gestao para negocios caseiros (confeitaria, manicure, artesanato, marmitas) voltada para pessoas de todas as idades, incluindo idosos e jovens sem experiencia tech.

**Principio de UX:** simplicidade radical — maximo 3 toques para qualquer acao principal.

O trabalho esta dividido em 11 epicos que podem ser desenvolvidos em paralelo, sem ordem de prioridade fixa.

---

## Goals

- Monetizar usuarios gratuitos com anuncios moderados (AdMob)
- Integrar pagamento real para planos Premium (RevenueCat)
- Completar todas as telas mobile que possuem stubs ou estao ausentes
- Permitir edicao de vendas existentes (API + mobile)
- Implementar alertas de estoque baixo com indicadores visuais
- Adicionar notificacoes push para todos os eventos criticos do negocio
- Suportar uso offline completo com sincronizacao automatica
- Corrigir bugs de UI pendentes e garantir consistencia visual

---

## Epico 1: Anuncios (Ads) para Plano Gratuito

### US-101: Integrar SDK do AdMob com Expo

**Descricao:** Como desenvolvedor, preciso configurar o SDK do Google AdMob no projeto Expo para exibir anuncios no app.

**Criterios de Aceite:**

- [ ] Instalar e configurar `react-native-google-mobile-ads` no projeto Expo
- [ ] Configurar App IDs (iOS + Android) no `app.config.ts`
- [ ] Criar componente `<AdBanner />` em `@lucro-caseiro/ui` que encapsula o BannerAd
- [ ] Criar componente `<AdInterstitial />` com hook `useInterstitial()` para controlar exibicao
- [ ] Ads so aparecem para usuarios com `plan === 'free'` (verificar via `useLimits()`)
- [ ] Adicionar flag `ADMOB_ENABLED` em config para desativar em dev/teste
- [ ] Typecheck e lint passam

### US-102: Exibir banner no Dashboard

**Descricao:** Como usuario gratuito, vejo um banner de anuncio no dashboard para que o app possa se monetizar sem cobrar assinatura.

**Criterios de Aceite:**

- [ ] Banner (320x50) exibido na parte inferior do dashboard, acima da tab bar
- [ ] Banner nao aparece para usuarios Premium
- [ ] Banner nao cobre conteudo importante (scroll ajustado com padding)
- [ ] Banner carrega de forma assincrona — tela nao trava se ad falhar
- [ ] Verificar visualmente no dispositivo

### US-103: Exibir banners em telas de lista

**Descricao:** Como usuario gratuito, vejo banners em listas longas (receitas, produtos) intercalados com o conteudo.

**Criterios de Aceite:**

- [ ] Banner nativo (inline) exibido a cada 8 itens nas FlatLists de: produtos, receitas
- [ ] Banner nao aparece se a lista tiver menos de 5 itens
- [ ] Banner nao aparece para usuarios Premium
- [ ] Performance da lista nao e afetada (banner lazy-loaded)
- [ ] Verificar visualmente no dispositivo

### US-104: Exibir intersticial apos concluir venda

**Descricao:** Como usuario gratuito, vejo um anuncio intersticial apos concluir uma venda, com frequency capping para nao ser irritante.

**Criterios de Aceite:**

- [ ] Intersticial exibido apos confirmar venda no wizard (tela de sucesso)
- [ ] Frequency capping: maximo 1 intersticial a cada 3 minutos (controlado via state local)
- [ ] Se o ad nao carregar a tempo, nao bloqueia o fluxo — usuario segue normalmente
- [ ] Nao aparece para usuarios Premium
- [ ] Contador de frequency cap persiste durante a sessao (Zustand ou ref)
- [ ] Verificar visualmente no dispositivo

### US-105: Remover todos os ads para Premium

**Descricao:** Como usuario Premium, nao vejo nenhum anuncio no app.

**Criterios de Aceite:**

- [ ] Todos os componentes de ad verificam `plan === 'premium'` antes de renderizar
- [ ] Criar hook `useShowAds()` centralizado que retorna boolean
- [ ] Ao fazer upgrade para Premium, ads somem imediatamente (sem restart)
- [ ] Ao expirar Premium (downgrade), ads voltam a aparecer
- [ ] Typecheck passa

---

## Epico 2: Integracao de Planos / Pagamento

### US-201: Integrar RevenueCat SDK no mobile

**Descricao:** Como desenvolvedor, preciso configurar o RevenueCat para gerenciar assinaturas via Apple IAP e Google Play.

**Criterios de Aceite:**

- [ ] Instalar `react-native-purchases` (RevenueCat SDK)
- [ ] Configurar API keys (iOS + Android) no `app.config.ts`
- [ ] Inicializar RevenueCat no app startup com `Purchases.configure()`
- [ ] Identificar usuario com o `userId` do auth (`Purchases.logIn()`)
- [ ] Criar hook `useSubscription()` que expoe: `isSubscribed`, `currentPlan`, `subscribe()`, `restore()`
- [ ] Typecheck passa

### US-202: Implementar fluxo de compra na Paywall

**Descricao:** Como usuario, quero assinar o plano Premium diretamente pela paywall do app.

**Criterios de Aceite:**

- [ ] Botao "Assinar" na paywall abre o fluxo nativo de compra (Apple/Google)
- [ ] Dois produtos configurados: mensal (R$14,90) e anual (R$119,90)
- [ ] Selo "Economia de 33%" exibido no plano anual
- [ ] Ao concluir compra, chamar endpoint backend para ativar premium
- [ ] Loading state durante processamento do pagamento
- [ ] Erro de pagamento exibe mensagem amigavel em portugues
- [ ] Verificar visualmente no dispositivo

### US-203: Trial de 7 dias para novos usuarios

**Descricao:** Como novo usuario, tenho 7 dias de trial Premium gratuito para experimentar todas as funcionalidades.

**Criterios de Aceite:**

- [ ] Trial configurado nos produtos do RevenueCat (7 dias free trial)
- [ ] Paywall exibe "7 dias gratis, depois R$14,90/mes" para usuarios elegiveis
- [ ] Usuario em trial tem `plan === 'premium'` com `planExpiresAt` setado
- [ ] Ao expirar trial sem pagamento, downgrade automatico para free
- [ ] Notificacao push 1 dia antes do trial expirar (ver Epico 9)
- [ ] Usuario so pode usar trial uma vez (controlado pelo RevenueCat)

### US-204: Webhook de confirmacao de pagamento no backend

**Descricao:** Como sistema, preciso receber webhooks do RevenueCat para ativar/desativar premium de forma confiavel.

**Criterios de Aceite:**

- [ ] Endpoint `POST /api/webhooks/revenuecat` criado em `apps/api/src/features/subscription/`
- [ ] Validar assinatura do webhook (shared secret do RevenueCat)
- [ ] Evento `INITIAL_PURCHASE` e `RENEWAL`: chamar `activatePremium(userId, planExpiresAt)`
- [ ] Evento `CANCELLATION` e `EXPIRATION`: chamar `deactivatePremium(userId)`
- [ ] Evento `BILLING_ISSUE`: marcar flag no perfil para exibir aviso no app
- [ ] Logs estruturados para cada evento recebido
- [ ] Testes unitarios para cada tipo de evento

### US-205: Restaurar compras

**Descricao:** Como usuario que reinstalou o app, quero restaurar minha assinatura sem precisar pagar novamente.

**Criterios de Aceite:**

- [ ] Botao "Restaurar compras" visivel na tela de Settings e na Paywall
- [ ] Ao clicar, chamar `Purchases.restorePurchases()`
- [ ] Se assinatura ativa encontrada, sincronizar com backend (ativar premium)
- [ ] Se nenhuma assinatura encontrada, exibir mensagem: "Nenhuma assinatura encontrada"
- [ ] Loading state durante restauracao
- [ ] Verificar visualmente no dispositivo

### US-206: Verificar assinatura ao abrir o app

**Descricao:** Como sistema, preciso verificar o status da assinatura sempre que o app abrir para manter o estado consistente.

**Criterios de Aceite:**

- [ ] No app startup (apos auth), consultar `Purchases.getCustomerInfo()`
- [ ] Comparar estado local (`plan`) com estado do RevenueCat
- [ ] Se divergir, sincronizar com backend (chamar endpoint de sync)
- [ ] Se `planExpiresAt` estiver no passado e RevenueCat confirmar expiracao, fazer downgrade
- [ ] Operacao silenciosa — nao bloqueia carregamento do app

### US-207: Cancelamento e downgrade graceful

**Descricao:** Como usuario que cancelou a assinatura, quero continuar usando Premium ate o fim do periodo pago.

**Criterios de Aceite:**

- [ ] Cancelamento no RevenueCat nao remove acesso imediatamente
- [ ] Acesso Premium permanece ate `planExpiresAt`
- [ ] Apos expiracao, limites freemium voltam a valer
- [ ] Dados criados durante Premium nao sao deletados (apenas bloqueio de criacao)
- [ ] Exibir aviso: "Seu plano Premium expira em X dias" quando cancelado mas ainda ativo
- [ ] Tela de Settings mostra status: "Premium (cancela em DD/MM/YYYY)"

---

## Epico 3: Completar Tela de Produtos

### US-301: Implementar modal de detalhe do produto

**Descricao:** Como usuario, quero ver os detalhes de um produto ao clicar nele na lista.

**Criterios de Aceite:**

- [ ] Callback `onProductPress` em `products.tsx` abre modal de detalhe (substituir stub `() => {}`)
- [ ] Modal exibe: nome, categoria, preco de venda, custo, estoque atual, alerta de estoque, foto (placeholder se nao tiver)
- [ ] Botoes de acao: "Editar" e "Excluir" com confirmacao
- [ ] Botao "Editar" abre modal de edicao com dados pre-preenchidos
- [ ] Botao "Excluir" exibe dialogo de confirmacao antes de deletar (soft delete)
- [ ] Verificar visualmente no dispositivo

### US-302: Implementar modal de criacao via FAB

**Descricao:** Como usuario, quero criar um novo produto clicando no botao flutuante (+).

**Criterios de Aceite:**

- [ ] Callback `onAddPress` e FAB `onPress` em `products.tsx` abrem modal de criacao (substituir stubs)
- [ ] Modal usa `CreateProductForm` ja existente
- [ ] Verificacao de limite freemium antes de abrir (usar `useLimitCheck("products")` se aplicavel)
- [ ] Apos criar, lista atualiza automaticamente (invalidate query)
- [ ] Verificar visualmente no dispositivo

### US-303: Upload de foto do produto

**Descricao:** Como usuario, quero tirar foto ou escolher da galeria para meu produto.

**Criterios de Aceite:**

- [ ] Instalar e configurar `expo-image-picker`
- [ ] Botao de foto no `CreateProductForm` e `EditProductForm` (substituir "em breve")
- [ ] Opcoes: "Tirar foto" ou "Escolher da galeria" (ActionSheet)
- [ ] Comprimir imagem antes de upload (max 800x800, qualidade 0.7)
- [ ] Upload para storage (Supabase Storage ou S3)
- [ ] Exibir preview da foto selecionada antes de salvar
- [ ] Fallback com icone de placeholder quando sem foto
- [ ] Verificar visualmente no dispositivo

---

## Epico 4: Completar Telas de Embalagens

### US-401: Tela de listagem de embalagens

**Descricao:** Como usuario, quero ver todas as minhas embalagens cadastradas em uma lista organizada.

**Criterios de Aceite:**

- [ ] Tela `/packaging` exibe FlatList com todas as embalagens do usuario
- [ ] Cada card mostra: nome, tipo (icone), custo unitario, fornecedor
- [ ] Busca por nome (campo de pesquisa no topo)
- [ ] Filtro por tipo (chips: caixa/sacola/pote/filme/rotulo/outro)
- [ ] FAB (+) para criar nova embalagem
- [ ] Pull-to-refresh
- [ ] Empty state: "Nenhuma embalagem cadastrada. Adicione sua primeira!"
- [ ] Verificar visualmente no dispositivo

### US-402: Modal de edicao de embalagem

**Descricao:** Como usuario, quero editar os dados de uma embalagem existente.

**Criterios de Aceite:**

- [ ] Ao clicar em uma embalagem na lista, abrir modal de detalhe
- [ ] Botao "Editar" abre formulario pre-preenchido com dados atuais
- [ ] Campos editaveis: nome, tipo, custo unitario, fornecedor
- [ ] Validacao: nome obrigatorio, custo >= 0
- [ ] Apos salvar, lista atualiza automaticamente
- [ ] Botao "Excluir" com confirmacao
- [ ] Verificar visualmente no dispositivo

### US-403: Vincular embalagem a produto

**Descricao:** Como usuario, quero associar embalagens aos meus produtos para controlar custos.

**Criterios de Aceite:**

- [ ] Na tela de detalhe/edicao do produto, secao "Embalagens" com lista de embalagens vinculadas
- [ ] Botao "Adicionar embalagem" abre seletor (lista de embalagens disponiveis)
- [ ] Cada vinculo mostra: nome da embalagem + custo
- [ ] Possivel remover vinculo (swipe ou botao X)
- [ ] Total de custo de embalagens exibido como subtotal
- [ ] Verificar visualmente no dispositivo

---

## Epico 5: Completar Telas de Rotulos

### US-501: Tela de listagem de rotulos

**Descricao:** Como usuario, quero ver todos os meus rotulos cadastrados.

**Criterios de Aceite:**

- [ ] Tela `/labels` exibe FlatList com todos os rotulos do usuario
- [ ] Cada card mostra: nome do rotulo, template usado, produto vinculado (se houver)
- [ ] Miniatura visual do rotulo no card (preview simplificado)
- [ ] FAB (+) para criar novo rotulo
- [ ] Pull-to-refresh
- [ ] Empty state: "Nenhum rotulo cadastrado. Crie seu primeiro!"
- [ ] Verificar visualmente no dispositivo

### US-502: Modal de edicao de rotulo

**Descricao:** Como usuario, quero editar um rotulo existente.

**Criterios de Aceite:**

- [ ] Ao clicar em um rotulo na lista, abrir modal de detalhe com preview
- [ ] Botao "Editar" abre formulario pre-preenchido
- [ ] Campos editaveis: nome, template, dados do rotulo (campos dinamicos por template)
- [ ] Trocar template mantem dados compativeis
- [ ] Apos salvar, lista atualiza automaticamente
- [ ] Botao "Excluir" com confirmacao
- [ ] Verificar visualmente no dispositivo

### US-503: Preview visual do rotulo

**Descricao:** Como usuario, quero ver como meu rotulo vai ficar antes de imprimir.

**Criterios de Aceite:**

- [ ] Componente `<LabelPreviewFull />` renderiza o rotulo em tamanho real (ou proporcional)
- [ ] Preview atualiza em tempo real conforme usuario edita campos
- [ ] Cada template tem layout visual distinto (classico/moderno/minimalista/artesanal/gourmet)
- [ ] Preview exibe: nome do produto, ingredientes, peso, data de fabricacao, validade, preco
- [ ] Verificar visualmente no dispositivo

### US-504: Vincular rotulo a produto

**Descricao:** Como usuario, quero vincular um rotulo a um produto especifico.

**Criterios de Aceite:**

- [ ] Seletor de produto no formulario de criacao/edicao de rotulo
- [ ] Ao selecionar produto, dados do rotulo sao pre-preenchidos (nome, preco)
- [ ] Na tela de detalhe do produto, exibir rotulos vinculados
- [ ] Verificar visualmente no dispositivo

---

## Epico 6: Edicao de Vendas

### US-601: Endpoint PATCH /sales/:id no backend

**Descricao:** Como sistema, preciso de um endpoint para editar vendas existentes.

**Criterios de Aceite:**

- [ ] Endpoint `PATCH /api/sales/:id` criado em `sales.routes.ts`
- [ ] Campos editaveis: items (array), clientId, paymentMethod, notes
- [ ] Recalcular total automaticamente ao alterar items
- [ ] Validacao: venda com status `cancelled` nao pode ser editada
- [ ] Validacao: todos os items devem ter `quantity > 0` e `unitPrice >= 0`
- [ ] Ajustar estoque: reverter estoque antigo + decrementar novo estoque
- [ ] Usecase `updateSale` com logica de dominio
- [ ] Scoped por `userId` (RLS)
- [ ] Testes unitarios: dominio + usecases
- [ ] Typecheck e lint passam

### US-602: UI de edicao de venda no mobile

**Descricao:** Como usuario, quero editar uma venda que ja registrei (corrigir itens, cliente ou pagamento).

**Criterios de Aceite:**

- [ ] Botao "Editar" na tela de detalhe da venda (SaleDetail)
- [ ] So aparece para vendas com status `pending` ou `paid` (nao `cancelled`)
- [ ] Abre wizard similar ao de criacao, pre-preenchido com dados atuais
- [ ] Steps: produtos (editar quantidades, adicionar/remover) → cliente → pagamento → revisao
- [ ] Ao confirmar, chamar `PATCH /api/sales/:id`
- [ ] Apos salvar, voltar para detalhe atualizado
- [ ] Verificar visualmente no dispositivo

---

## Epico 7: Historico de Precificacao

### US-701: Tela de historico de precificacao

**Descricao:** Como usuario, quero ver os calculos de precificacao que ja fiz para acompanhar a evolucao dos custos.

**Criterios de Aceite:**

- [ ] Botao "Historico" na tela de precificacao (`/pricing`)
- [ ] Abre modal/tela com lista de calculos anteriores (usar `GET /pricing/product/:productId/history`)
- [ ] Seletor de produto no topo para filtrar historico
- [ ] Cada item mostra: data, custo total, preco sugerido, margem
- [ ] Ao clicar em um item, exibir breakdown completo (ingredientes, embalagem, mao de obra, fixos)
- [ ] Grafico simples de evolucao de preco ao longo do tempo (opcional: usar victory-native ou similar)
- [ ] Empty state: "Nenhum calculo encontrado para este produto"
- [ ] Verificar visualmente no dispositivo

---

## Epico 8: Alertas de Estoque Baixo

### US-801: Badge de estoque baixo na lista de produtos

**Descricao:** Como usuario, quero ver rapidamente quais produtos estao com estoque baixo.

**Criterios de Aceite:**

- [ ] ProductCard exibe badge vermelho "Estoque baixo" quando `stockQuantity <= stockAlertThreshold`
- [ ] Badge exibe badge amarelo "Estoque zerado" quando `stockQuantity === 0`
- [ ] Badge posicionado no canto superior direito do card
- [ ] Verificar visualmente no dispositivo

### US-802: Secao de alertas no Dashboard

**Descricao:** Como usuario, quero ver um resumo de alertas importantes ao abrir o app.

**Criterios de Aceite:**

- [ ] Secao "Alertas" no dashboard (home), abaixo do resumo do dia
- [ ] Listar produtos com estoque baixo (max 5, com link "Ver todos")
- [ ] Cada alerta mostra: nome do produto, estoque atual, limiar de alerta
- [ ] Icone de atencao (triangulo amarelo) ao lado de cada alerta
- [ ] Se nao houver alertas, secao nao aparece (nao mostrar empty state)
- [ ] Verificar visualmente no dispositivo

### US-803: Endpoint de produtos com estoque baixo

**Descricao:** Como sistema, preciso de um endpoint dedicado para listar produtos com estoque baixo.

**Criterios de Aceite:**

- [ ] Endpoint `GET /api/products/low-stock` criado em `products.routes.ts`
- [ ] Retorna produtos onde `stockQuantity <= stockAlertThreshold` e `stockQuantity IS NOT NULL`
- [ ] Ordenar por urgencia: estoque zerado primeiro, depois menor estoque
- [ ] Scoped por `userId`
- [ ] Hook `useLowStockProducts()` no mobile
- [ ] Testes unitarios
- [ ] Typecheck e lint passam

---

## Epico 9: Notificacoes Push

### US-901: Configurar Expo Notifications

**Descricao:** Como desenvolvedor, preciso configurar o sistema de notificacoes push no projeto Expo.

**Criterios de Aceite:**

- [ ] Instalar e configurar `expo-notifications`
- [ ] Solicitar permissao de notificacao no onboarding (explicar beneficio antes de pedir)
- [ ] Registrar push token no backend (novo campo `pushToken` no perfil do usuario)
- [ ] Endpoint `PATCH /api/subscription/profile` aceita campo `pushToken`
- [ ] Configurar notification channels no Android (vendas, estoque, lembretes)
- [ ] Typecheck passa

### US-902: Notificacao de vendas pendentes

**Descricao:** Como usuario, quero ser lembrado de vendas que ainda nao foram pagas.

**Criterios de Aceite:**

- [ ] Cron job ou scheduled task no backend (a cada 6 horas)
- [ ] Buscar vendas com status `pending` criadas ha mais de 24 horas
- [ ] Enviar push: "Voce tem X vendas pendentes. Confira!"
- [ ] Ao clicar na notificacao, abrir lista de vendas filtrada por "pendente"
- [ ] Maximo 1 notificacao por dia para este tipo
- [ ] Testes unitarios para logica de selecao

### US-903: Notificacao de aniversarios de clientes

**Descricao:** Como usuario, quero ser lembrado dos aniversarios dos meus clientes para parabeniza-los.

**Criterios de Aceite:**

- [ ] Cron job diario no backend (executar as 8h no fuso do usuario)
- [ ] Buscar clientes com aniversario hoje
- [ ] Enviar push: "Hoje e aniversario de [Nome]! Que tal enviar uma mensagem?"
- [ ] Ao clicar, abrir detalhe do cliente (com botao WhatsApp)
- [ ] Se multiplos aniversarios: "Hoje e aniversario de [Nome] e mais X clientes!"
- [ ] Testes unitarios

### US-904: Notificacao de estoque baixo

**Descricao:** Como usuario, quero ser avisado quando um produto atinge estoque baixo.

**Criterios de Aceite:**

- [ ] Disparar apos uma venda que reduz estoque abaixo do limiar
- [ ] Push: "[Produto] esta com estoque baixo (X unidades restantes)"
- [ ] Ao clicar, abrir detalhe do produto
- [ ] Nao repetir notificacao para mesmo produto no mesmo dia
- [ ] Testes unitarios

### US-905: Resumo semanal

**Descricao:** Como usuario, quero receber um resumo semanal do meu negocio.

**Criterios de Aceite:**

- [ ] Cron job semanal (segunda-feira as 9h)
- [ ] Push: "Semana passada: X vendas, R$Y faturado, lucro de R$Z"
- [ ] Ao clicar, abrir dashboard financeiro
- [ ] Endpoint `GET /api/finance/summary/weekly` para calcular dados
- [ ] Testes unitarios

### US-906: Lembretes de vendas do dia

**Descricao:** Como usuario, quero ser lembrado das vendas agendadas para hoje.

**Criterios de Aceite:**

- [ ] Cron job diario (executar as 7h)
- [ ] Buscar vendas com data de hoje e status `pending`
- [ ] Push: "Voce tem X vendas para hoje. Bora faturar!"
- [ ] Ao clicar, abrir lista de vendas do dia
- [ ] Testes unitarios

### US-907: Tela de configuracoes de notificacao

**Descricao:** Como usuario, quero controlar quais notificacoes recebo.

**Criterios de Aceite:**

- [ ] Secao "Notificacoes" na tela de Settings
- [ ] Toggles individuais para cada tipo: vendas pendentes, aniversarios, estoque baixo, resumo semanal, lembretes diarios
- [ ] Preferencias salvas no perfil do usuario (backend)
- [ ] Endpoint `PATCH /api/subscription/profile` aceita campo `notificationPreferences` (JSON)
- [ ] Default: todos ativados
- [ ] Verificar visualmente no dispositivo

---

## Epico 10: Modo Offline com Sync

### US-1001: Cache local com MMKV ou WatermelonDB

**Descricao:** Como desenvolvedor, preciso de um mecanismo de cache local para armazenar dados offline.

**Criterios de Aceite:**

- [ ] Avaliar e escolher: MMKV (key-value simples) vs WatermelonDB (banco relacional offline)
- [ ] Recomendacao: WatermelonDB para sync bidirecional completo
- [ ] Configurar schemas locais espelhando as tabelas principais: products, clients, sales, recipes, finance
- [ ] Integrar com TanStack Query: `queryClient` usa cache local como fallback
- [ ] Typecheck passa

### US-1002: Fila de operacoes offline

**Descricao:** Como usuario, quero poder criar vendas e cadastros mesmo sem internet, e ter certeza que serao salvos quando a internet voltar.

**Criterios de Aceite:**

- [ ] Criar `OfflineQueue` (Zustand ou WatermelonDB) que armazena operacoes pendentes
- [ ] Cada operacao na fila contem: tipo (POST/PATCH/DELETE), endpoint, payload, timestamp
- [ ] Operacoes sao enfileiradas quando `NetInfo.isConnected === false`
- [ ] Fila persiste entre reinicializacoes do app (storage persistente)
- [ ] Maximo de 100 operacoes na fila (exibir aviso ao usuario ao atingir 80%)
- [ ] Testes unitarios para enqueue/dequeue

### US-1003: Sincronizacao automatica ao reconectar

**Descricao:** Como usuario, quero que meus dados sejam sincronizados automaticamente quando a internet voltar.

**Criterios de Aceite:**

- [ ] Listener em `@react-native-community/netinfo` detecta reconexao
- [ ] Ao reconectar, processar fila de operacoes em ordem (FIFO)
- [ ] Cada operacao e enviada ao backend e removida da fila ao sucesso
- [ ] Se uma operacao falhar (409 conflict), marcar como conflito e continuar com as demais
- [ ] Apos sync completo, invalidar queries relevantes para atualizar tela
- [ ] Notificacao local: "Dados sincronizados com sucesso!" ou "X itens com conflito"
- [ ] Testes unitarios para fluxo de sync

### US-1004: Indicador visual de modo offline

**Descricao:** Como usuario, quero saber claramente quando estou usando o app sem internet.

**Criterios de Aceite:**

- [ ] Banner amarelo no topo da tela: "Voce esta offline. Seus dados serao salvos localmente."
- [ ] Banner aparece/desaparece automaticamente com mudanca de conectividade
- [ ] Quando offline e com operacoes pendentes, mostrar badge: "X alteracoes pendentes"
- [ ] Icone de nuvem com X na status bar/header
- [ ] Banner nao ocupa espaco quando online (animated collapse)
- [ ] Verificar visualmente no dispositivo

### US-1005: Resolucao de conflitos

**Descricao:** Como sistema, preciso resolver conflitos quando dados foram alterados offline e online simultaneamente.

**Criterios de Aceite:**

- [ ] Estrategia padrao: last-write-wins (baseado em `updatedAt`)
- [ ] Para conflitos criticos (vendas duplicadas), exibir modal ao usuario: "Este registro foi alterado. Manter sua versao ou a do servidor?"
- [ ] Campo `syncVersion` adicionado nas tabelas principais (incrementado a cada update)
- [ ] Backend retorna 409 Conflict quando `syncVersion` nao bate
- [ ] Conflitos resolvidos automaticamente sao logados para debug
- [ ] Testes unitarios para cenarios de conflito

---

## Epico 11: Correcoes de UI Pendentes

### US-1101: Corrigir stubs de callback na tela de Clientes

**Descricao:** Como usuario, quero que o botao de editar cliente funcione corretamente.

**Criterios de Aceite:**

- [ ] Callback `onEditPress` em `tabs/clients.tsx` abre formulario de edicao (substituir stub `() => {}`)
- [ ] Botao de editar aparece sempre no detalhe do cliente (remover condicional de phone)
- [ ] Formulario de edicao pre-preenchido com dados atuais
- [ ] Apos salvar, detalhe atualiza automaticamente
- [ ] Verificar visualmente no dispositivo

### US-1102: Corrigir filtros invertidos na tela de Vendas

**Descricao:** Como usuario, quero que os filtros de status nas vendas funcionem corretamente.

**Criterios de Aceite:**

- [ ] Revisar labels dos filtros em `tabs/sales.tsx`
- [ ] Garantir que filtro "Pendente" mostra vendas pendentes (nao pagas)
- [ ] Garantir que filtro "Pago" mostra vendas pagas (nao pendentes)
- [ ] Verificar mapeamento de status no hook de filtragem
- [ ] Verificar visualmente no dispositivo

### US-1103: Consistencia visual (cores e espacamento)

**Descricao:** Como usuario, quero uma experiencia visual consistente em todas as telas.

**Criterios de Aceite:**

- [ ] Auditar todas as telas mobile para cores hardcoded (substituir por tokens de `@lucro-caseiro/ui`)
- [ ] Padronizar espacamentos: usar scale do design system (4, 8, 12, 16, 24, 32)
- [ ] Padronizar raios de borda: sm(8), md(12), lg(16)
- [ ] Verificar contraste WCAG AA (4.5:1) em todos os textos
- [ ] Fontes: minimo 16px em todo o app
- [ ] Botoes: minimo 48x48dp em todo o app
- [ ] Verificar em light mode e dark mode
- [ ] Typecheck e lint passam

### US-1104: Testes mobile basicos

**Descricao:** Como desenvolvedor, preciso de testes basicos para as funcionalidades criticas do mobile.

**Criterios de Aceite:**

- [ ] Testes para hooks principais: `useClients`, `useSales`, `useProducts`, `useRecipes`
- [ ] Testes para logica de dominio no mobile (se houver)
- [ ] Testes para `useShowAds()` (verifica plano)
- [ ] Testes para `useSubscription()` (estados de assinatura)
- [ ] Testes para `OfflineQueue` (enqueue, dequeue, persist)
- [ ] Todos os testes passam em CI

---

## Requisitos Funcionais (Consolidado)

- FR-1: O sistema deve exibir anuncios AdMob (banner + intersticial) apenas para usuarios do plano gratuito
- FR-2: Intersticiais devem respeitar frequency capping de 1 a cada 3 minutos
- FR-3: O sistema deve integrar com RevenueCat para processar pagamentos via Apple IAP e Google Play
- FR-4: Novos usuarios devem receber trial de 7 dias do plano Premium
- FR-5: Webhooks do RevenueCat devem ativar/desativar premium automaticamente
- FR-6: O usuario deve poder restaurar compras anteriores
- FR-7: A tela de produtos deve ter modais funcionais de detalhe, criacao e edicao
- FR-8: Upload de foto de produto deve comprimir imagem e enviar para storage
- FR-9: Embalagens devem ter CRUD completo no mobile com vinculacao a produtos
- FR-10: Rotulos devem ter CRUD completo no mobile com preview visual e vinculacao a produtos
- FR-11: Vendas existentes devem ser editaveis via PATCH /sales/:id
- FR-12: Historico de precificacao deve ser visualizavel filtrado por produto
- FR-13: Produtos com estoque baixo devem exibir badge visual e aparecer em alertas no dashboard
- FR-14: O sistema deve enviar notificacoes push para: vendas pendentes, aniversarios, estoque baixo, resumo semanal, lembretes diarios
- FR-15: O usuario deve poder configurar quais notificacoes deseja receber
- FR-16: O app deve funcionar offline com fila de operacoes e sync automatico ao reconectar
- FR-17: Conflitos de sync devem ser resolvidos por last-write-wins, com modal para conflitos criticos
- FR-18: Indicador visual claro deve informar quando o app esta offline
- FR-19: Callbacks stub nas telas de Clientes e Vendas devem ser implementados
- FR-20: Todas as telas devem usar tokens do design system (sem cores hardcoded)

## Non-Goals (Fora de Escopo)

- Integracao bancaria ou conciliacao automatica
- Chat ou mensageria dentro do app
- Multi-usuario / equipe (cada conta e individual)
- Marketplace ou loja virtual
- Importacao de dados de outros apps
- Informacoes nutricionais em receitas
- Conversao automatica de unidades
- Integracao com impressoras de etiquetas
- App para desktop (Windows/Mac nativo)
- Integracao com redes sociais para divulgacao
- Sistema de cupons ou descontos
- Programa de fidelidade para clientes

## Consideracoes Tecnicas

### Ads (AdMob)

- Usar `react-native-google-mobile-ads` (compativel com Expo via config plugin)
- Test ads em desenvolvimento (IDs de teste do Google)
- Mediation nao necessaria inicialmente (apenas AdMob direto)

### Pagamento (RevenueCat)

- `react-native-purchases` e o SDK oficial
- Configurar produtos no App Store Connect e Google Play Console
- Webhook endpoint deve ser idempotente (mesmo evento pode chegar mais de uma vez)
- Testar com sandbox accounts (Apple) e test cards (Google)

### Offline (WatermelonDB)

- Compativel com Expo via bare workflow ou config plugin
- Schema local deve ser subset do schema do Postgres (nao precisa espelhar tudo)
- Sync protocol: pull changes desde ultimo sync timestamp, push operacoes pendentes
- Considerar tamanho do banco local (limpar dados antigos periodicamente)

### Notificacoes (Expo Notifications)

- Push tokens expiram — renovar periodicamente
- Cron jobs no backend: usar `node-cron` ou servico externo (Railway cron, Render cron)
- Rate limiting: nao enviar mais de 5 pushes por dia por usuario
- Deep linking: notificacao deve abrir tela correta no app

### Performance

- Ads nao devem impactar scroll performance (lazy load)
- Offline queue nao deve crescer indefinidamente (limite de 100 operacoes)
- Sync deve ser incremental (nao re-baixar tudo)
- Cache de imagens de produtos com `expo-image` (ja otimizado)

## Metricas de Sucesso

- **Ads**: CPM medio > R$2,00; usuarios free nao desinstalam por causa de ads (retention D7 > 40%)
- **Assinaturas**: taxa de conversao free→premium > 5% em 30 dias; trial→paid > 20%
- **Produtos**: 100% dos callbacks funcionais; foto uploadada em > 30% dos produtos
- **Embalagens/Rotulos**: CRUD completo utilizavel em < 3 toques por acao
- **Vendas**: edicao de venda usada em > 10% das vendas
- **Estoque**: usuarios com alertas configurados checam estoque 2x mais
- **Notificacoes**: opt-in rate > 60%; click-through rate > 15%
- **Offline**: zero perda de dados em cenarios de sync; < 1% de conflitos nao resolvidos
- **UI**: zero callbacks stub restantes; 100% tokens do design system

## Open Questions

1. **Storage de imagens**: usar Supabase Storage (ja no stack?) ou S3 dedicado?
2. **Cron jobs**: usar `node-cron` no mesmo servidor da API ou servico externo (mais confiavel)?
3. **WatermelonDB vs MMKV**: WatermelonDB e mais robusto mas adiciona complexidade. MMKV + TanStack Query persistor seria suficiente para o MVP offline?
4. **RevenueCat pricing**: o plano gratuito do RevenueCat suporta ate $2.5k MTR — suficiente para o lancamento?
5. **Ads e UX**: testar com usuarios reais se o intersticial apos venda e aceitavel ou se causa frustacao
6. **Deep linking**: notificacoes precisam de deep linking configurado no Expo Router — validar compatibilidade
7. **Trial abuse**: como prevenir criacao de multiplas contas para usar trial infinito? (RevenueCat device-level tracking?)
