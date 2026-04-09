# PRD: Testes Gerais de Funcionalidades — Lucro Caseiro

## Introducao

Plano de testes abrangente para validar todas as funcionalidades do app Lucro Caseiro (mobile + API), cobrindo fluxos criticos, integracao, UI/UX, edge cases, performance e acessibilidade. O objetivo e garantir que o app esteja 100% funcional em iOS, Android e Web antes de qualquer release.

## Goals

- Validar todos os fluxos criticos end-to-end (cadastro, login, venda, financeiro)
- Identificar e corrigir funcionalidades incompletas (TODOs, stubs, hardcodes)
- Garantir integracao correta entre Mobile <-> API <-> Supabase
- Verificar consistencia de UI/UX em iOS, Android e Web
- Validar acessibilidade (fontes, contraste, touch targets)
- Garantir performance aceitavel em dispositivos reais
- Cobrir edge cases e validacoes de formularios

---

## Estado Atual do App (Inventario)

### Funcionalidades Completas (API + Mobile)

- Autenticacao (email/senha, Google OAuth)
- Onboarding (selecao de nicho, nome do negocio)
- Vendas (CRUD completo, filtros, resumo diario)
- Clientes (CRUD completo, busca, aniversarios)
- Financeiro (CRUD, resumo mensal, filtros)
- Precificacao (calculadora, historico)
- Embalagens (CRUD, vinculo com produtos)
- Rotulos/Labels (CRUD, templates)

### Funcionalidades Incompletas (Mobile)

- **Produtos**: navegacao para detalhe e criacao nao conectada na tela principal
- **Receitas**: navegacao para criacao nao conectada
- **Settings**: dados hardcoded (nao busca perfil real da API)
- **Perfil**: botao "Editar" nao funcional
- **Subscription/Limites**: API pronta mas mobile nao consome

### API — Todos os endpoints implementados e testados unitariamente

---

## User Stories — Autenticacao

### US-001: Cadastro com email e senha

**Descricao:** Como novo usuario, quero criar uma conta com email e senha para acessar o app.

**Acceptance Criteria:**

- [ ] Tela de registro renderiza corretamente em iOS, Android e Web
- [ ] Validacao de email invalido mostra mensagem em portugues
- [ ] Validacao de senha fraca mostra mensagem em portugues
- [ ] Email ja cadastrado mostra mensagem "Esse e-mail ja tem uma conta"
- [ ] Cadastro com sucesso envia email de confirmacao (verificar inbox + spam)
- [ ] Apos confirmar email, usuario consegue fazer login
- [ ] Campos respeitam autoCapitalize="none" e autoComplete corretos

### US-002: Login com email e senha

**Descricao:** Como usuario cadastrado, quero fazer login para acessar meus dados.

**Acceptance Criteria:**

- [ ] Tela de login renderiza corretamente em iOS, Android e Web
- [ ] Login com credenciais corretas redireciona para onboarding (primeira vez) ou tabs (recorrente)
- [ ] Login com credenciais erradas mostra "E-mail ou senha incorretos"
- [ ] Login com email nao confirmado mostra mensagem de verificacao
- [ ] Botao "Mostrar/Ocultar" senha funciona
- [ ] Loading state aparece durante autenticacao

### US-003: Login com Google

**Descricao:** Como usuario, quero entrar com minha conta Google para facilitar o acesso.

**Acceptance Criteria:**

- [ ] Botao "Entrar com Google" abre browser de autenticacao
- [ ] Apos autenticar no Google, retorna ao app logado
- [ ] Cancelamento do fluxo mostra "Login cancelado"
- [ ] Erro de OAuth mostra mensagem generica amigavel
- [ ] Funciona em iOS e Android (Web pode ter comportamento diferente)

### US-004: Esqueci minha senha

**Descricao:** Como usuario, quero recuperar minha senha caso esqueca.

**Acceptance Criteria:**

- [ ] Clicar em "Esqueci minha senha" sem email preenchido mostra alerta
- [ ] Clicar com email invalido mostra alerta de email invalido
- [ ] Clicar com email valido envia email de reset e mostra confirmacao
- [ ] Email de reset chega na caixa de entrada
- [ ] Loading state ("Enviando...") aparece durante a requisicao

### US-005: Logout

**Descricao:** Como usuario logado, quero sair da minha conta.

**Acceptance Criteria:**

- [ ] Botao de logout em Settings funciona
- [ ] Apos logout, redireciona para tela de login
- [ ] Sessao e limpa (reabrir app nao loga automaticamente)
- [ ] Estado do app e resetado (nao mostra dados do usuario anterior)

### US-006: Persistencia de sessao

**Descricao:** Como usuario logado, quero que minha sessao persista ao reabrir o app.

**Acceptance Criteria:**

- [ ] Fechar e reabrir o app mantem o usuario logado
- [ ] Dar reload (shake > reload) mantem o usuario logado
- [ ] Token expirado redireciona para login graciosamente

---

## User Stories — Onboarding

### US-007: Fluxo de onboarding completo

**Descricao:** Como novo usuario, quero configurar meu negocio na primeira vez que acesso o app.

**Acceptance Criteria:**

- [ ] Apos primeiro login, redireciona para onboarding
- [ ] Step 1: Tela de boas-vindas com botao "Comecar"
- [ ] Step 2: Selecao de nicho (Confeitaria, Panificacao, Salgados, Bebidas) funciona
- [ ] Step 3: Campos de nome do negocio e email preenchidos corretamente
- [ ] Botao "Comecar a usar" finaliza onboarding e redireciona para tabs
- [ ] Progress dots refletem o step atual
- [ ] Navegacao "Voltar" entre steps funciona

### US-008: Persistencia do onboarding

**Descricao:** Como usuario que completou o onboarding, nao quero repetir o processo.

**Acceptance Criteria:**

- [ ] Apos completar onboarding, reload nao volta para onboarding
- [ ] Fechar e reabrir o app nao repete onboarding
- [ ] Estado e persistido no SecureStore do dispositivo
- [ ] Funciona em iOS, Android e Web

---

## User Stories — Home (Dashboard)

### US-009: Dashboard inicial

**Descricao:** Como usuario, quero ver um resumo do meu negocio ao abrir o app.

**Acceptance Criteria:**

- [ ] Mostra resumo de vendas do dia (quantidade e total)
- [ ] Mostra resumo financeiro mensal (receita, despesas, lucro)
- [ ] Lista aniversariantes do mes
- [ ] Lista pedidos recentes com nome do cliente e valor
- [ ] Loading states aparecem enquanto dados carregam
- [ ] Empty states aparecem quando nao ha dados
- [ ] Pull-to-refresh funciona (se implementado)

---

## User Stories — Produtos

### US-010: Listar produtos

**Descricao:** Como usuario, quero ver todos os meus produtos cadastrados.

**Acceptance Criteria:**

- [ ] Tela de produtos lista todos os produtos do usuario
- [ ] Busca por nome filtra corretamente
- [ ] Empty state aparece quando nao ha produtos
- [ ] Loading state aparece durante carregamento
- [ ] Informacoes do produto visiveis: nome, categoria, preco

### US-011: Cadastrar produto

**Descricao:** Como usuario, quero cadastrar novos produtos no meu catalogo.

**Acceptance Criteria:**

- [ ] Formulario de criacao acessivel (via Nova Venda ou tela de Produtos)
- [ ] Campos: nome, categoria, preco de venda, descricao (opcional)
- [ ] Validacao: nome obrigatorio, categoria obrigatoria, preco > 0
- [ ] Mensagens de erro em portugues
- [ ] Produto cadastrado aparece na lista imediatamente
- [ ] Alert de sucesso aparece apos cadastro
- [ ] Modal fecha apos sucesso (quando via Nova Venda)

### US-012: Navegacao de produtos (BUG CONHECIDO)

**Descricao:** A tela principal de produtos tem TODOs nao implementados.

**Acceptance Criteria:**

- [ ] Botao "Novo produto" na tela de produtos abre formulario de criacao
- [ ] Clicar em um produto abre tela de detalhe/edicao
- [ ] Edicao de produto funciona (nome, preco, categoria, descricao)
- [ ] Exclusao de produto funciona com confirmacao

---

## User Stories — Vendas

### US-013: Criar nova venda (fluxo completo)

**Descricao:** Como usuario, quero registrar uma venda de forma rapida.

**Acceptance Criteria:**

- [ ] Step 1 - Produtos: lista produtos disponiveis com busca
- [ ] Step 1 - Produtos: toque adiciona ao carrinho, toque longo remove
- [ ] Step 1 - Produtos: badge de quantidade aparece no card
- [ ] Step 1 - Produtos: total selecionado aparece na barra inferior
- [ ] Step 1 - Produtos: botao "Cadastrar produto" aparece se lista vazia
- [ ] Step 2 - Cliente: opcao "Sem cliente (avulso)" funciona
- [ ] Step 2 - Cliente: busca de cliente funciona
- [ ] Step 2 - Cliente: selecao de cliente destaca o card
- [ ] Step 3 - Pagamento: 5 opcoes (Pix, Dinheiro, Cartao, Fiado, Transferencia)
- [ ] Step 3 - Pagamento: selecao destaca a opcao escolhida
- [ ] Step 4 - Revisao: mostra itens, cliente, pagamento e total corretos
- [ ] Step 4 - "Registrar venda" cria a venda e mostra alert de sucesso
- [ ] Apos registro, formulario e resetado
- [ ] Progress dots refletem o step atual
- [ ] Botao "<" volta ao step anterior
- [ ] Botoes "Voltar"/"Proximo" navegam entre steps

### US-014: Listar vendas

**Descricao:** Como usuario, quero ver o historico de todas as minhas vendas.

**Acceptance Criteria:**

- [ ] Tab "Vendas" lista vendas agrupadas por data
- [ ] Filtros funcionam: Todas, Pendentes, Pagas, Canceladas
- [ ] Cada venda mostra: cliente, valor, status, data
- [ ] Empty state aparece para filtros sem resultados
- [ ] Loading state durante carregamento

### US-015: Detalhes e status de venda

**Descricao:** Como usuario, quero ver detalhes de uma venda e atualizar seu status.

**Acceptance Criteria:**

- [ ] Clicar em uma venda abre modal de detalhes
- [ ] Modal mostra: itens, quantidades, precos, cliente, pagamento, total
- [ ] Botao de atualizar status funciona (ex: pendente -> paga)
- [ ] Status atualizado reflete na lista imediatamente

---

## User Stories — Clientes

### US-016: Listar e buscar clientes

**Descricao:** Como usuario, quero ver e buscar meus clientes.

**Acceptance Criteria:**

- [ ] Tab "Clientes" lista todos os clientes
- [ ] Busca por nome/telefone funciona
- [ ] Cada cliente mostra: avatar (inicial), nome, telefone
- [ ] Empty state quando nao ha clientes

### US-017: Cadastrar cliente

**Descricao:** Como usuario, quero cadastrar novos clientes.

**Acceptance Criteria:**

- [ ] FAB "Novo cliente" abre formulario
- [ ] Campos: nome (obrigatorio), telefone, email, endereco, data de nascimento
- [ ] Validacao de campos obrigatorios com mensagem em portugues
- [ ] Cliente cadastrado aparece na lista imediatamente
- [ ] Alert de sucesso apos cadastro

### US-018: Detalhe do cliente

**Descricao:** Como usuario, quero ver detalhes de um cliente.

**Acceptance Criteria:**

- [ ] Clicar em um cliente abre modal de detalhes
- [ ] Mostra informacoes do cliente
- [ ] Historico de compras do cliente (se implementado)

---

## User Stories — Financeiro

### US-019: Dashboard financeiro

**Descricao:** Como usuario, quero ver meu resumo financeiro.

**Acceptance Criteria:**

- [ ] Tela de financeiro mostra resumo mensal (receita, despesas, lucro)
- [ ] Lista de lancamentos com tipo (receita/despesa), valor, categoria
- [ ] Filtros por tipo e categoria funcionam
- [ ] Filtro por periodo funciona
- [ ] Loading state durante carregamento

### US-020: Criar lancamento financeiro

**Descricao:** Como usuario, quero registrar receitas e despesas.

**Acceptance Criteria:**

- [ ] Formulario de criacao acessivel
- [ ] Campos: tipo (receita/despesa), valor, categoria, descricao, data
- [ ] Validacao: valor obrigatorio e > 0, categoria obrigatoria
- [ ] Lancamento aparece na lista imediatamente
- [ ] Resumo mensal atualiza apos criacao

### US-021: Editar e excluir lancamento

**Descricao:** Como usuario, quero corrigir ou remover lancamentos.

**Acceptance Criteria:**

- [ ] Edicao de lancamento funciona
- [ ] Exclusao com confirmacao funciona
- [ ] Lista e resumo atualizam apos edicao/exclusao

---

## User Stories — Receitas

### US-022: Listar receitas

**Descricao:** Como usuario, quero ver minhas receitas cadastradas.

**Acceptance Criteria:**

- [ ] Tela de receitas lista todas as receitas
- [ ] Cada receita mostra: nome, rendimento, custo estimado
- [ ] Empty state quando nao ha receitas
- [ ] Loading state durante carregamento

### US-023: Criar receita (BUG CONHECIDO)

**Descricao:** A navegacao para criacao de receita nao esta conectada.

**Acceptance Criteria:**

- [ ] Botao de criar receita abre formulario/tela de criacao
- [ ] Campos: nome, ingredientes (com quantidades e unidades), modo de preparo, rendimento
- [ ] Calculo automatico de custo baseado nos ingredientes
- [ ] Receita cadastrada aparece na lista

### US-024: Escalar receita

**Descricao:** Como usuario, quero ajustar a quantidade de uma receita.

**Acceptance Criteria:**

- [ ] Funcao de escalar receita por multiplicador funciona
- [ ] Quantidades de ingredientes sao recalculadas corretamente
- [ ] Custo total e recalculado

---

## User Stories — Precificacao

### US-025: Calcular preco de venda

**Descricao:** Como usuario, quero calcular o preco ideal de venda dos meus produtos.

**Acceptance Criteria:**

- [ ] Formulario de precificacao renderiza corretamente
- [ ] Calculo considera: custo dos ingredientes, embalagem, mao de obra, margem
- [ ] Resultado mostra preco sugerido
- [ ] Historico de precificacao acessivel
- [ ] Salvar precificacao funciona

---

## User Stories — Embalagens

### US-026: Gerenciar embalagens

**Descricao:** Como usuario, quero cadastrar e gerenciar minhas embalagens.

**Acceptance Criteria:**

- [ ] Lista de embalagens com nome, tipo e custo
- [ ] Cadastro de nova embalagem funciona
- [ ] Edicao de embalagem funciona
- [ ] Exclusao com confirmacao funciona
- [ ] Vinculo de embalagem com produto funciona
- [ ] Empty state quando nao ha embalagens

---

## User Stories — Configuracoes

### US-027: Tela de configuracoes (BUG CONHECIDO)

**Descricao:** A tela de settings usa dados hardcoded ao inves de buscar da API.

**Acceptance Criteria:**

- [ ] Mostra dados reais do usuario (nome, negocio, tipo)
- [ ] Mostra plano atual (free/premium) vindo da API
- [ ] Toggle de tema claro/escuro funciona e persiste
- [ ] Toggle de notificacoes funciona
- [ ] Botao "Editar perfil" abre formulario funcional
- [ ] Edicao de perfil salva na API e atualiza a tela
- [ ] Logout funciona corretamente

### US-028: Limites freemium

**Descricao:** Como usuario free, quero ver meus limites de uso.

**Acceptance Criteria:**

- [ ] Banner de limite aparece quando proximo do limite
- [ ] Limites corretos: 30 vendas/mes, 20 clientes, 5 receitas, 3 embalagens
- [ ] Tentativa de exceder limite mostra paywall
- [ ] Enforcement feito no backend (nao apenas no front)

---

## User Stories — Navegacao e UI

### US-029: Tab bar e navegacao

**Descricao:** Como usuario, quero navegar facilmente entre as telas do app.

**Acceptance Criteria:**

- [ ] Tab bar mostra icones corretos (nao triangulos) — Inicio, Vendas, +, Clientes, Mais
- [ ] Tab ativa destaca com cor primaria
- [ ] Botao central "+" (Nova Venda) funciona
- [ ] Menu "Mais" lista todas as opcoes e navega corretamente
- [ ] Voltar (<) funciona em todas as telas stack
- [ ] Deep links funcionam (se aplicavel)

### US-030: Tema e acessibilidade

**Descricao:** Como usuario, quero que o app seja acessivel e visualmente adequado.

**Acceptance Criteria:**

- [ ] Tema escuro renderiza corretamente em todas as telas
- [ ] Tema claro renderiza corretamente em todas as telas
- [ ] Troca de tema aplica em tempo real
- [ ] Fontes minimas 16px em todo o app
- [ ] Botoes minimo 48x48dp de area tocavel
- [ ] Contraste minimo 4.5:1 (WCAG AA) em textos
- [ ] Icones sempre acompanhados de texto
- [ ] Linguagem simples, sem jargoes tecnicos
- [ ] Todas as mensagens de erro/UI em portugues brasileiro

### US-031: Loading e empty states

**Descricao:** Como usuario, quero feedback visual quando dados estao carregando ou vazios.

**Acceptance Criteria:**

- [ ] Todas as listas mostram loading spinner enquanto carregam
- [ ] Todas as listas mostram empty state adequado quando vazias
- [ ] Botoes de submit mostram loading durante requisicao
- [ ] Botoes ficam desabilitados durante loading (sem duplo clique)

---

## User Stories — Cross-platform

### US-032: Consistencia iOS vs Android vs Web

**Descricao:** Como usuario, quero que o app funcione igualmente em todas as plataformas.

**Acceptance Criteria:**

- [ ] iOS: todas as telas renderizam corretamente
- [ ] iOS: SafeAreaView respeita notch e home indicator
- [ ] iOS: tab bar com altura correta (88px com padding)
- [ ] Android: todas as telas renderizam corretamente
- [ ] Android: status bar nao sobrepoe conteudo
- [ ] Android: tab bar com altura correta (64px com padding)
- [ ] Web: todas as telas renderizam corretamente
- [ ] Web: navegacao por URL funciona
- [ ] Teclado nao cobre inputs em formularios (iOS e Android)
- [ ] ScrollView com keyboardShouldPersistTaps="handled" em formularios

---

## User Stories — API (Testes Automatizados)

### US-033: Testes de integracao — Products API

**Acceptance Criteria:**

- [ ] POST /products — cria produto com dados validos
- [ ] POST /products — rejeita sem nome (400)
- [ ] POST /products — rejeita sem preco (400)
- [ ] POST /products — rejeita preco <= 0 (400)
- [ ] GET /products — lista produtos do usuario (nao de outros)
- [ ] GET /products — paginacao funciona
- [ ] GET /products — filtro por categoria funciona
- [ ] GET /products — busca por nome funciona
- [ ] GET /products/:id — retorna produto correto
- [ ] GET /products/:id — 404 para ID inexistente
- [ ] PATCH /products/:id — atualiza campos
- [ ] DELETE /products/:id — remove produto
- [ ] Todas as rotas retornam 401 sem token

### US-034: Testes de integracao — Sales API

**Acceptance Criteria:**

- [ ] POST /sales — cria venda com itens
- [ ] POST /sales — rejeita sem itens (400)
- [ ] POST /sales — rejeita item com quantidade <= 0
- [ ] GET /sales — lista vendas do usuario
- [ ] GET /sales — filtro por status funciona
- [ ] GET /sales — filtro por cliente funciona
- [ ] GET /sales — filtro por periodo funciona
- [ ] GET /sales/summary/today — retorna resumo correto
- [ ] PATCH /sales/:id/status — atualiza status
- [ ] Todas as rotas retornam 401 sem token

### US-035: Testes de integracao — Clients API

**Acceptance Criteria:**

- [ ] POST /clients — cria cliente com dados validos
- [ ] POST /clients — rejeita sem nome (400)
- [ ] GET /clients — lista clientes do usuario
- [ ] GET /clients — busca por nome/telefone funciona
- [ ] GET /clients/birthdays — retorna aniversariantes do mes
- [ ] PATCH /clients/:id — atualiza campos
- [ ] DELETE /clients/:id — remove cliente
- [ ] Todas as rotas retornam 401 sem token

### US-036: Testes de integracao — Finance API

**Acceptance Criteria:**

- [ ] POST /finance — cria lancamento (receita e despesa)
- [ ] POST /finance — rejeita valor <= 0
- [ ] GET /finance — lista lancamentos com filtros
- [ ] GET /finance/summary — resumo mensal correto
- [ ] PATCH /finance/:id — atualiza lancamento
- [ ] DELETE /finance/:id — remove lancamento
- [ ] Todas as rotas retornam 401 sem token

### US-037: Testes de integracao — Recipes API

**Acceptance Criteria:**

- [ ] POST /recipes — cria receita com ingredientes
- [ ] GET /recipes — lista receitas do usuario
- [ ] GET /recipes/:id/scale — escala receita corretamente
- [ ] PATCH /recipes/:id — atualiza receita
- [ ] DELETE /recipes/:id — remove receita
- [ ] Todas as rotas retornam 401 sem token

### US-038: Testes de integracao — Demais endpoints

**Acceptance Criteria:**

- [ ] Pricing: POST /calculate, GET /, GET /product/:id/history
- [ ] Packaging: CRUD completo + link/unlink com produto
- [ ] Labels: CRUD completo + GET /templates
- [ ] Subscription: GET /profile, PATCH /profile, GET /limits
- [ ] Todas as rotas escopadas por userId (nunca retorna dados de outro usuario)

---

## User Stories — Performance

### US-039: Performance geral

**Acceptance Criteria:**

- [ ] App abre em menos de 3 segundos (cold start)
- [ ] Navegacao entre tabs e instantanea (< 300ms)
- [ ] Listas com 50+ itens scrollam sem lag
- [ ] Criacao de venda completa em menos de 30 segundos (3 toques + confirmar)
- [ ] API responde em menos de 500ms para queries simples
- [ ] Nao ha memory leaks obvios apos navegacao prolongada

---

## Functional Requirements

- FR-1: Todo fluxo de autenticacao deve funcionar end-to-end (cadastro, login, logout, reset senha)
- FR-2: Onboarding deve persistir estado entre sessoes via SecureStore
- FR-3: Todas as listas devem ser escopadas por userId (seguranca)
- FR-4: Validacoes de formulario devem ser consistentes (front + back)
- FR-5: Mensagens de erro devem ser em portugues brasileiro
- FR-6: Todas as acoes principais devem ser completaveis em no maximo 3 toques
- FR-7: Loading states devem aparecer em toda operacao assincrona
- FR-8: Empty states devem ser informativos e oferecer acao (quando aplicavel)
- FR-9: Limites freemium devem ser enforced no backend
- FR-10: O app deve funcionar offline graciosamente (mostrar dados em cache, fila de acoes)

## Non-Goals

- Testes de carga/stress da API
- Testes de seguranca avancados (pentesting)
- Testes de atualizacao OTA (Expo Updates)
- Testes de notificacoes push
- Testes de pagamento/assinatura real (Stripe/RevenueCat)
- Testes de exportacao PDF/Excel

## Technical Considerations

- Testes automatizados da API: Vitest + supertest para integracao
- Testes de dominio: ja existem, verificar cobertura
- Testes mobile: React Native Testing Library para componentes criticos
- Testes E2E: considerar Detox ou Maestro para fluxos criticos
- Banco de testes: usar banco separado ou transacoes com rollback
- CI: integrar testes no pipeline existente

## Success Metrics

- 100% dos fluxos criticos (login, venda, financeiro) funcionando sem erros
- 0 TODOs bloqueantes remanescentes nas telas principais
- Todas as telas renderizam corretamente em iOS, Android e Web
- Tempo medio de resposta da API < 500ms
- 0 crashes em uso normal por 30 minutos consecutivos
- Cobertura de testes de dominio > 80%
- Cobertura de testes de integracao da API > 70%

## Open Questions

- Devemos priorizar corrigir os TODOs (produtos, receitas, settings) antes de testar, ou testar o estado atual?
- Qual banco usar para testes de integracao? Supabase de staging ou Postgres local?
- Devemos implementar testes E2E com Detox/Maestro nesta fase ou em uma fase futura?
- O fluxo offline (cache + fila de acoes) esta no escopo desta sprint?
- Limites freemium: o enforcement ja esta implementado no backend ou so definido no contrato?
