# PRD: Correcoes de UI e Melhorias de Usabilidade (Mobile)

## Introducao

Diversas telas do app Lucro Caseiro possuem bugs funcionais (botoes sem acao, dados hardcoded, labels trocadas) e inconsistencias visuais (cores hardcoded, espacamentos fora do design system, componentes de navegacao inconsistentes). Este PRD cobre todas as correcoes e melhorias de UI sem alterar a estrutura das telas ou adicionar novas features.

Escopo: apenas o app mobile (`apps/mobile/src`). Sem novos endpoints de API.

---

## Goals

- Todos os botoes e acoes de navegacao nas telas existentes devem funcionar corretamente
- Dados reais devem substituir todos os valores hardcoded / mock
- Todas as telas devem usar tokens do design system (`theme.colors.*`, `spacing.*`, `radii.*`) sem cores ou espacamentos numericos soltos
- Componentes de navegacao (voltar, fechar, back) devem usar `Ionicons` de forma consistente
- `Pressable` deve substituir `TouchableOpacity` em todos os lugares

---

## User Stories

### US-001: Corrigir labels invertidas dos filtros de vendas

**Descricao:** Como usuario, quero filtrar vendas por status correto, para nao confundir vendas pendentes com concluidas.

**Problema:** Em `apps/mobile/src/app/tabs/sales.tsx:19-24`, o array `FILTER_TABS` mapeia `key: "paid"` para o label "Pendentes" e `key: "pending"` para "Concluidas" — invertido em relacao ao significado semantico.

**Acceptance Criteria:**

- [ ] `FILTER_TABS` corrigido: `{ key: "pending", label: "Pendentes" }` e `{ key: "paid", label: "Concluidas" }`
- [ ] Ao selecionar "Pendentes", a API recebe `status: "pending"`
- [ ] Ao selecionar "Concluidas", a API recebe `status: "paid"`
- [ ] Typecheck passa

---

### US-002: Corrigir botao "Nova Venda" no estado vazio de vendas

**Descricao:** Como usuario, quero que o botao "Nova Venda" na tela de lista vazia me leve para o wizard de nova venda.

**Problema:** Em `apps/mobile/src/app/tabs/sales.tsx:135`, o `EmptyState` action tem `onPress={() => {}}`.

**Acceptance Criteria:**

- [ ] `onPress` do botao "Nova Venda" no `EmptyState` navega para `/tabs/new-sale` via `useRouter`
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-003: Conectar acoes de Produtos (criar e ver detalhe)

**Descricao:** Como usuario, quero criar novos produtos e ver o detalhe de um produto existente.

**Problema:** Em `apps/mobile/src/app/products.tsx`, todos os callbacks (`onProductPress`, `onAddPress`, FAB `onPress`) sao `() => {}` (TODOs sem implementacao). O produto nao pode ser criado nem visualizado.

**Contexto de implementacao:** Nao existe tela de detalhe ou criacao de produto ainda. A solucao e abrir um `Modal` com `CreateProductForm` (ja existe em `features/products/components/`) para criacao, e exibir `ProductCard` em modal para detalhe (ou mensagem "Em breve").

**Acceptance Criteria:**

- [ ] Botao "Novo produto" (FAB) e `onAddPress` abrem um `Modal` com `CreateProductForm`
- [ ] Apos criar produto com sucesso, o modal fecha e a lista atualiza
- [ ] `onProductPress` abre um modal de detalhe simples (pode ser "Em breve" por ora, mas nao pode ficar silencioso)
- [ ] `products.tsx` usa `theme.colors.background` no lugar de `"#F9FAFB"` hardcoded
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-004: Conectar acoes de Receitas (criar e ver detalhe)

**Descricao:** Como usuario, quero criar novas receitas e navegar ao detalhe de uma receita.

**Problema:** Em `apps/mobile/src/app/recipes.tsx:31`, o botao "Criar receita" no estado vazio tem `onPress={() => {}}`. Alem disso, `RecipeList` e renderizado sem `onRecipePress` e `onAddPress`, entao os callbacks do componente filho tambem ficam sem efeito.

**Acceptance Criteria:**

- [ ] `recipes.tsx` passa `onAddPress` e `onRecipePress` para `<RecipeList>`
- [ ] `onAddPress` abre um `Modal` com `CreateRecipeForm` (ja existe em `features/recipes/components/`)
- [ ] Apos criar receita com sucesso, o modal fecha e a lista atualiza (invalidar query)
- [ ] `onRecipePress` abre `RecipeDetail` em modal (ja existe em `features/recipes/components/`)
- [ ] O duplo-fetch de `useRecipes()` em `recipes.tsx` e removido (a screen nao precisa mais chamar `useRecipes` diretamente, pois o `RecipeList` ja o faz)
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-005: Corrigir botao "Editar cliente" sempre visivel e funcional

**Descricao:** Como usuario, quero editar os dados de qualquer cliente, independente de ele ter telefone cadastrado.

**Problemas:**

1. Em `apps/mobile/src/features/clients/components/client-detail.tsx:127`, o botao "Editar cliente" so aparece se `client.phone` existe — bug condicional errado.
2. Em `apps/mobile/src/app/tabs/clients.tsx:99`, `onEditPress` e `() => {}` — nao faz nada.

**Acceptance Criteria:**

- [ ] Botao "Editar cliente" em `ClientDetail` e renderizado sempre, independente de `client.phone`
- [ ] `onEditPress` em `clients.tsx` abre o `CreateClientForm` (em modo edicao) ou um modal equivalente com os dados preenchidos
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-006: Adicionar botao de nova entrada no Financeiro

**Descricao:** Como usuario, quero adicionar entradas e saidas financeiras diretamente na tela de financeiro.

**Problema:** Em `apps/mobile/src/app/finance.tsx`, `FinanceDashboard` e chamado sem `onAddPress` nem `onEntryPress`. O componente `FinanceDashboard` ja suporta esses props mas nenhuma acao e conectada.

**Acceptance Criteria:**

- [ ] `finance.tsx` passa `onAddPress` para `FinanceDashboard` que abre um `Modal` com `CreateFinanceEntry` (ja existe em `features/finance/components/`)
- [ ] `finance.tsx` passa `onEntryPress` para `FinanceDashboard` que abre detalhe da entrada (pode ser modal simples por ora)
- [ ] Apos criar entrada, o modal fecha e summary/lista atualizam (invalidar queries)
- [ ] Um FAB com icone `+` e visivel na tela de financeiro quando a lista esta populada
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-007: Adicionar criacao de embalagens na tela de Packaging

**Descricao:** Como usuario, quero cadastrar novas embalagens diretamente na tela de Embalagens.

**Problema:** `apps/mobile/src/app/packaging.tsx` e totalmente read-only — nao ha FAB, botao ou acao para criar embalagens.

**Acceptance Criteria:**

- [ ] FAB com icone `+` (Ionicons `add`) adicionado na posicao `bottom: 24, right: 20`
- [ ] FAB abre um `Modal` com formulario de criacao de embalagem (campos: nome, custo, tipo)
- [ ] Apos criar com sucesso, modal fecha e lista atualiza
- [ ] `packaging.tsx` usa `theme.colors.background` no lugar de `"#F9FAFB"` hardcoded
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-008: Corrigir dados hardcoded e badge errado em Configuracoes

**Descricao:** Como usuario, quero ver meus dados reais (nome, negocio, plano) na tela de Configuracoes.

**Problemas em `apps/mobile/src/app/settings.tsx`:**

1. Linhas 22-27: `userName`, `userLastName`, `businessName`, `businessType`, `isPremium`, `planExpiry` sao todos valores hardcoded.
2. Linha 130: Badge do plano sempre mostra "PREMIUM" (`isPremium ? "PREMIUM" : "PREMIUM"`).
3. Linhas 91-97: Botao "Editar" no card de perfil tem `Pressable` sem `onPress`.

**Acceptance Criteria:**

- [ ] `useProfile()` (ja importado) e usado para preencher nome, negocio, tipo de negocio e status do plano
- [ ] Badge do plano mostra "FREE" quando `isPremium === false` e "PREMIUM" quando `true`
- [ ] Card de plano no modo Free mostra "Plano Gratuito" com os limites em vez de "Valido ate [data]"
- [ ] Botao "Editar" no card de perfil abre um `Alert` com "Em breve" (acao minima para nao ficar silencioso) — ou um modal de edicao se `CreateClientForm` puder ser reaproveitado
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-009: Corrigir toggle de tema e switch de notificacoes em Configuracoes

**Descricao:** Como usuario, quero alternar entre os temas Claro, Escuro e Auto, e ligar/desligar notificacoes.

**Problemas em `apps/mobile/src/app/settings.tsx`:**

1. Linhas 174-176: A opcao "Auto" nao faz nada quando pressionada.
2. Linhas 169-170: A variavel `isActive` e calculada mas nunca usada.
3. Linha 221: `Switch` de notificacoes tem `value={true}` hardcoded sem estado local.

**Acceptance Criteria:**

- [ ] Opcao "Auto" chama `toggleTheme()` (mesmo comportamento das outras ou simplesmente remove o override, voltando para o tema do sistema) — se a API `useTheme` nao suportar "auto", a opcao "Auto" fica desabilitada visivelmente (`opacity: 0.4`) com `Alert` "Em breve"
- [ ] Switch de notificacoes usa `useState(true)` e alterna corretamente entre ligado/desligado
- [ ] Variavel `isActive` removida se nao utilizada (evitar dead code)
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-010: Padronizar icones de navegacao (voltar/fechar)

**Descricao:** Como usuario, quero ver icones de navegacao consistentes em todas as telas.

**Problema:** Algumas telas usam texto simples `"< Voltar"` ou `"<"` como botao de voltar, enquanto outras (settings.tsx) usam `Ionicons name="arrow-back"`. A tela de detalhe de venda usa o texto "Fechar" como link.

**Arquivos afetados:**

- `apps/mobile/src/app/tabs/clients.tsx:93-97` — `"< Voltar"` em texto
- `apps/mobile/src/app/tabs/new-sale.tsx:178-180` — `"<"` em texto
- `apps/mobile/src/app/tabs/sales.tsx:176-178` — "Fechar" como texto link no modal

**Acceptance Criteria:**

- [ ] `clients.tsx` substitui `"< Voltar"` por `Ionicons name="arrow-back"` + label "Voltar" ao lado
- [ ] `new-sale.tsx` substitui `"<"` por `Ionicons name="arrow-back"` no header do wizard
- [ ] `sales.tsx` modal de detalhe usa `Ionicons name="close"` com hitSlop adequado
- [ ] Todos os botoes de navegacao tem `hitSlop={12}` para area de toque minima
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-011: Substituir cores e espacamentos hardcoded por tokens do design system

**Descricao:** Como desenvolvedor, quero que todas as telas usem exclusivamente tokens do design system, para garantir suporte correto a temas claro/escuro.

**Problemas identificados:**

- `apps/mobile/src/app/packaging.tsx:15` — `backgroundColor: "#F9FAFB"`; `ActivityIndicator color="#22C55E"`
- `apps/mobile/src/app/products.tsx:12` — `backgroundColor: "#F9FAFB"`
- `apps/mobile/src/features/products/components/product-list.tsx:28` — `color="#22C55E"` no ActivityIndicator
- `apps/mobile/src/app/tabs/more.tsx:52` — `padding: 20, gap: 12` hardcoded; item gap `14` hardcoded
- `apps/mobile/src/features/finance/components/finance-dashboard.tsx:152` — heading "Hoje" fixo (deveria ser dinamico ou "Lancamentos")

**Acceptance Criteria:**

- [ ] `packaging.tsx`: `"#F9FAFB"` → `theme.colors.background`; `"#22C55E"` → `theme.colors.primary`
- [ ] `products.tsx`: `"#F9FAFB"` → `theme.colors.background`
- [ ] `product-list.tsx`: `"#22C55E"` → `theme.colors.primary`
- [ ] `more.tsx`: `padding: 20` → `padding: spacing.xl`; `gap: 12` → `gap: spacing.md`; `gap: 14` → `gap: spacing.md`
- [ ] `finance-dashboard.tsx`: heading fixo "Hoje" substituido por `"Lancamentos"` (ou o nome do mes selecionado)
- [ ] Nenhum valor de cor hexadecimal ou numero de spacing solto remanescente nos arquivos listados
- [ ] Typecheck passa
- [ ] Verificar no browser com dev-browser skill

---

### US-012: Substituir TouchableOpacity por Pressable

**Descricao:** Como desenvolvedor, quero componentes de interacao consistentes em todo o codebase mobile.

**Arquivos afetados:**

- `apps/mobile/src/features/recipes/components/recipe-list.tsx:77` — `TouchableOpacity` nos filtros de categoria
- `apps/mobile/src/features/finance/components/finance-dashboard.tsx:90,100` — `TouchableOpacity` nos botoes de mes

**Acceptance Criteria:**

- [ ] Todos os `TouchableOpacity` substituidos por `Pressable` nos arquivos acima
- [ ] Comportamento visual identico (sem regressao)
- [ ] Typecheck passa

---

## Functional Requirements

- FR-1: Todo botao visivel na UI deve ter um `onPress` funcional (navegar, abrir modal ou mostrar feedback ao usuario)
- FR-2: Dados de perfil, plano e negocio devem vir de `useProfile()`, nunca de constantes hardcoded
- FR-3: Todas as cores devem referenciar `theme.colors.*`; todos os espacamentos devem usar `spacing.*` ou `radii.*`
- FR-4: Icones de navegacao (voltar/fechar) devem usar `Ionicons` consistentemente
- FR-5: `Pressable` e o componente de interacao padrao; `TouchableOpacity` nao deve ser usado
- FR-6: Telas com listas de dados (produtos, receitas, embalagens) devem oferecer acao de criacao via FAB ou botao no header
- FR-7: Apos qualquer mutacao (criar/editar), a query relevante deve ser invalidada para refletir os dados atualizados

## Non-Goals

- Nao criar novos endpoints de API
- Nao redesenhar a estrutura de navegacao (tabs, more menu)
- Nao implementar edicao completa de perfil do usuario (apenas feedback "Em breve" e suficiente)
- Nao implementar historico de compras por cliente (ja tem placeholder "Em breve")
- Nao implementar push notifications de verdade (apenas estado local no toggle)
- Nao criar telas novas — modais reutilizando componentes existentes

## Design Considerations

- Seguir o padrao ja estabelecido: `Modal` com `presentationStyle="pageSheet"` e `animationType="slide"`
- FABs: `position: absolute, bottom: 24, right: 20`, `width: 56, height: 56`, `borderRadius: radii.full`, `backgroundColor: theme.colors.primary`
- FABs usam `Ionicons name="add"` com `color: theme.colors.textOnPrimary` e `size: 28`
- Botoes de voltar: `Ionicons name="arrow-back"` tamanho 24, cor `theme.colors.text`
- Botoes de fechar modal: `Ionicons name="close"` tamanho 24, cor `theme.colors.text`

## Technical Considerations

- Hooks de criacao ja existem: `useCreateProduct`, `useCreateSale`, `useCreateRecipe`, `useCreateFinanceEntry` (verificar em cada `hooks.ts` de feature antes de implementar)
- Formularios de criacao ja existem: `CreateProductForm`, `CreateRecipeForm`, `CreateClientForm`, `CreateFinanceEntry`
- `useProfile()` ja existe em `features/subscription/hooks.ts` e retorna dados do usuario autenticado
- Ao invalidar queries apos mutacao, usar o `queryClient` do `@tanstack/react-query`

## Success Metrics

- Zero botoes/acoes silenciosas (todo `onPress` tem comportamento observavel)
- Zero cores hexadecimais hardcoded nas telas listadas
- Zero `TouchableOpacity` nos arquivos afetados
- Typecheck e lint passam sem erros novos

## Open Questions

- A API de `useTheme` suporta modo "auto" (seguir sistema)? Se nao, a opcao Auto em Configuracoes deve ser desabilitada com feedback visual.
- `CreateProductForm` e `CreateRecipeForm` aceitam `initialValues` para modo edicao? Verificar antes de implementar US-005 (editar cliente).
- Existe hook `useCreatePackaging` em `features/packaging/hooks.ts`? Se nao existir, US-007 precisa de um novo hook antes de conectar o formulario.
