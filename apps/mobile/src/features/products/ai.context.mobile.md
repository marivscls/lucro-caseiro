# ai.context.mobile.md — Products (Mobile Feature)

---

## Purpose

Catalogo de produtos do usuario: listar, buscar, criar, editar e excluir produtos com nome, categoria, preco de venda, descricao, controle de estoque e alerta de estoque baixo.

## Non-goals

- Nao calcula preco de venda (feature `pricing`).
- Nao gerencia receitas associadas (feature `recipes`).
- Nao registra vendas (feature `sales`).
- (Histórico) Upload de foto já implementado — `uploadProductImage` (Supabase Storage), usado na criação/edição.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Product`, `CreateProduct`, `UpdateProduct`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** `features/sales` (tela `new-sale` usa `useProducts` para selecionar produtos no carrinho), `features/labels` (rotulos podem ser vinculados a produtos).

## Code pointers

| Arquivo                                                                | Descricao                                                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/products/api.ts`                             | Funcoes HTTP (fetchProducts, fetchProduct, createProduct, updateProduct, deleteProduct)       |
| `apps/mobile/src/features/products/hooks.ts`                           | React Query hooks                                                                             |
| `apps/mobile/src/features/products/components/create-product-form.tsx` | Formulario de criacao                                                                         |
| `apps/mobile/src/features/products/components/sale-unit-toggle.tsx`    | Toggle "Por unidade / Por quilo (kg)" (usado na criacao e na edicao)                          |
| `apps/mobile/src/features/products/components/composite-toggle.tsx`    | Toggle "Produto simples / Produto composto (kit)"                                             |
| `apps/mobile/src/features/products/components/component-picker.tsx`    | Seletor de produtos-componentes do kit (chips + modal) — UI; re-exporta de `kit.ts`           |
| `apps/mobile/src/features/products/kit.ts`                             | Logica pura do kit: `draftsToComponents`, `kitTotalCost`, `chipLabel`, `validateProductDraft` |
| `apps/mobile/src/features/products/kit.test.ts`                        | Testes unitarios da logica pura do kit/validacao                                              |
| `apps/mobile/src/features/products/components/product-card.tsx`        | Card de produto na listagem                                                                   |
| `apps/mobile/src/features/products/components/product-list.tsx`        | Lista de produtos                                                                             |
| `apps/mobile/src/features/products/use-low-stock-notifier.ts`          | Hook que dispara notificacao local de estoque baixo (montado no root layout)                  |
| `apps/mobile/src/app/products.tsx`                                     | Screen (rota `/products`) com banner de estoque baixo + modal de detalhe/edicao inline        |
| `apps/mobile/src/shared/components/barcode-scanner.tsx`                | Scanner de codigo de barras/QR (expo-camera) — usado na criacao/edicao e na Nova Venda        |

## Components

### `ProductCard`

- **Props:** `{ product: Product; onPress?: () => void }`
- Exibe foto ou avatar com inicial, nome, categoria, preco de venda e badge de estoque (sem estoque/estoque baixo/quantidade).
- Produtos por peso (`saleUnit === "kg"`): preco exibido como "R$X/kg" e badge de estoque oculto.
- Produtos compostos (`isComposite`): badge **"Kit"** (lavender) ao lado do nome; badge de estoque oculto.

### `CompositeToggle`

- **Props:** `{ value: boolean; onChange: (value: boolean) => void }`
- Alternador segmentado "Produto simples" / "Produto composto (kit)". Usado em `CreateProductForm` e no modal de edicao.

### `ComponentPicker`

- **Props:** `{ value: ComponentDraft[]; onChange: (next) => void; excludeProductId?: string }`
- Lista os produtos **simples** do usuario (via `useProducts`, exclui compostos e o proprio produto em edicao) como chips selecionaveis; cada selecionado vira uma linha com Input de quantidade e botao remover.
- Mostra o **custo total do kit ao vivo** (soma de `costPrice x quantidade`).
- Helper `draftsToComponents(drafts)` converte os rascunhos (quantidade string) em `ProductComponentInput[]` (filtra qty <= 0/invalida).

### `SaleUnitToggle`

- **Props:** `{ value: SaleUnit; onChange: (value: SaleUnit) => void }`
- Alternador segmentado "Por unidade" / "Por quilo (kg)". Quando "kg", o preco passa a ser por quilo.
- Usado no `CreateProductForm` e no modal de edicao (`products.tsx`).

### `ProductList`

- **Props:** `{ category?: string; search?: string; onProductPress?: (id: string) => void; onAddPress?: () => void }`
- FlatList com contador de total.
- EmptyState quando sem dados.

### `CreateProductForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), categoria (obrigatorio), **tipo (toggle simples/kit)**, **unidade de venda (toggle por unidade/kg)**, preco de venda (obrigatorio, > 0; label vira "Preço por kg (R$)" quando kg), foto, descricao, **código de barras (opcional, com botão de escanear via câmera)**, quantidade em estoque, alerta de estoque baixo.
- Campos de estoque ficam ocultos quando "Por quilo (kg)" (estoque por unidade nao se aplica).
- Quando **kit** (`isComposite`): mostra o `ComponentPicker`; oculta o toggle de unidade de venda e os campos de estoque. O preco de venda continua sendo pedido (preco do kit). Validacao local: pelo menos um componente.

### `ProductDetailModal` (definido no screen)

- Modal inline no arquivo `products.tsx` com visualizacao e edicao do produto.
- Exibe avatar, nome (com badge "Kit" quando composto), categoria, preco, estoque atual (oculto para kits; com cor de alerta quando baixo), limite de alerta e descricao.
- Kits: exibe "Custo do kit" (rollup vindo do back) e um card **"O que vem no kit"** com `quantidade x nome` e custo por linha.
- Modo edicao com campos editaveis, incluindo o toggle simples/kit + `ComponentPicker`, código de barras (com botão de escanear), quantidade em estoque e alerta de estoque baixo.
- Botao de excluir com confirmacao.

### `LowStockBanner` (definido no screen)

- Banner no topo da lista de produtos exibido quando ha itens com estoque baixo (`useLowStockProducts`).
- Mostra a contagem de produtos abaixo do limite de alerta. Oculto quando nao ha itens baixos.

## Hooks

| Hook                    | Tipo          | Descricao                                                                    |
| ----------------------- | ------------- | ---------------------------------------------------------------------------- |
| `useProducts(opts?)`    | `useQuery`    | Lista paginada. Query key: `["products", opts]`                              |
| `useProduct(id)`        | `useQuery`    | Detalhe. Query key: `["products", id]`                                       |
| `useCreateProduct()`    | `useMutation` | Cria produto. Invalida `["products"]`.                                       |
| `useUpdateProduct()`    | `useMutation` | Atualiza produto. Invalida `["products"]`.                                   |
| `useDeleteProduct()`    | `useMutation` | Remove produto. Invalida `["products"]`.                                     |
| `useLowStockProducts()` | `useQuery`    | Produtos abaixo do limite de alerta. Query key: `["products", "low-stock"]`. |

## API Integration

| Endpoint                     | Verbo  | Funcao                  | Parametros                                 |
| ---------------------------- | ------ | ----------------------- | ------------------------------------------ |
| `/api/v1/products`           | GET    | `fetchProducts`         | `?page=N&limit=N&category=cat&search=term` |
| `/api/v1/products/:id`       | GET    | `fetchProduct`          | path param `id`                            |
| `/api/v1/products`           | POST   | `createProduct`         | body: `CreateProduct`                      |
| `/api/v1/products/:id`       | PATCH  | `updateProduct`         | body: `UpdateProduct`                      |
| `/api/v1/products/:id`       | DELETE | `deleteProduct`         | -                                          |
| `/api/v1/products/low-stock` | GET    | `fetchLowStockProducts` | retorna produtos com estoque <= alerta     |

## Contracts

- `Product` — produto (id, name, category, salePrice, saleUnit, costPrice, description, photoUrl, code, stockQuantity, stockAlertThreshold, isComposite, components?).
- `CreateProduct` — payload de criacao (name, category, salePrice, saleUnit?, description?, photoUrl?, code?, stockQuantity?, stockAlertThreshold?, isComposite?, components?).
- `UpdateProduct` — payload de edicao.
- `ProductComponentInput` — `{ componentProductId, quantity }` (entrada do kit).
- `ProductComponent` — `{ componentProductId, name, costPrice, quantity }` (componente resolvido para exibicao).
- `SaleUnit` — `"unit" | "kg"` (default `"unit"`; quando `"kg"`, `salePrice` = preco por quilo).

## Error Handling

- **Erro de listagem:** EmptyState com "Nao foi possivel carregar seus produtos. Tente novamente."
- **Erro de criacao:** `Alert.alert("Erro", "Nao foi possivel cadastrar o produto. Tente novamente.")`.
- **Erro de edicao/exclusao:** Alert generico.
- **Validacao local:** nome obrigatorio, categoria obrigatoria, preco > 0.

## Performance

- FlatList simples para listagem.
- Modal de detalhe carrega produto individual via `useProduct(id)`.

## Test matrix

- [ ] `useProducts` retorna dados paginados
- [x] `validateProductDraft` valida nome obrigatorio (`kit.test.ts`)
- [x] `validateProductDraft` valida preco > 0 (`kit.test.ts`)
- [ ] `ProductCard` exibe badge de estoque correto
- [ ] `ProductCard` exibe badge "Kit" para produto composto
- [x] `kitTotalCost` calcula custo total do kit ao vivo (`kit.test.ts`)
- [x] `validateProductDraft` exige >= 1 componente quando kit (`kit.test.ts`)
- [x] `draftsToComponents` descarta quantidade invalida/<= 0 (`kit.test.ts`)
- [ ] Exclusao de produto com confirmacao
- [ ] Edicao inline no modal

## Examples

- Acessado via Home (quick access "Produtos") ou rota `/products`.
- Fluxo: lista -> FAB "Novo produto" -> modal criacao -> salvar.
- Tap em produto -> modal detalhe -> editar -> salvar.

## Change log / Decisions

- Detalhe/edicao do produto implementado como modal inline no screen (nao como componente separado na feature).
- Upload de foto e em breve ("em breve").
- Estoque agora e visivel e editavel no modal de detalhe (antes so podia ser definido na criacao).
- Banner de estoque baixo no topo da lista para dar visibilidade ao recurso.
- Notificacao de estoque baixo implementada como **notificacao local** (`use-low-stock-notifier.ts`), pois o backend ainda nao envia push. Dispara quando um produto entra na faixa de alerta; dedupe via AsyncStorage (`lowStockNotifiedIds`). Apos uma venda, `useCreateSale` invalida `["products"]` para revalidar o estoque e disparar o alerta.
- 2026-05-30: **venda por peso (R$/kg)** — `SaleUnitToggle` na criacao e edicao. Quando "kg", o preco vira "Preço por kg" e os campos de estoque ficam ocultos. Card e detalhe do produto exibem "R$X/kg" e ocultam estoque para produtos por peso.
- 2026-05-30: **produto composto / kit / caixinha** — `CompositeToggle` (simples/kit) + `ComponentPicker` (escolhe produtos simples + quantidade, mostra custo total ao vivo) na criacao e edicao. Card e detalhe exibem badge "Kit"; detalhe mostra "Custo do kit" e a lista "O que vem no kit". Kits ocultam unidade de venda e estoque por unidade. Custo do kit e calculado no backend (rollup) e exibido via `product.costPrice`/`product.components`. Sem aninhamento (kit dentro de kit) no MVP.
- 2026-06-15: **logica pura do kit extraida** — `draftsToComponents`, `kitTotalCost`, `chipLabel` e `validateProductDraft` movidos para `kit.ts` (puro, sem React Native) e cobertos por `kit.test.ts`. `component-picker.tsx` re-exporta `draftsToComponents`/`ComponentDraft` (imports existentes seguem funcionando). `CreateProductForm.handleSubmit` agora usa `validateProductDraft`. `kitTotalCost` espelha `calculateCompositeCost` do backend (custo nulo conta 0); o `costPrice` vem na listagem (`findAll` -> `toProduct`), entao produtos sem custo definido (sem receita) somam 0.
- 2026-06-16: **código de barras + scanner de câmera** — produtos ganharam o campo opcional `code` (SKU/código de barras). `CreateProductForm` e o modal de edição têm o campo "Código de barras" com botão de **escanear** (`BarcodeScanner` em `shared/components/barcode-scanner.tsx`, via `expo-camera`). Na **Nova Venda**, "Usar código"/o ícone de scan abrem a câmera; o código lido vai pra busca (o back casa por **nome OU código**), com fallback "Digitar à mão". **Requer dev/prod build novo** (módulo nativo da câmera); permissão no `app.json` (plugin `expo-camera`).
- 2026-06-15: **redesign do "Novo produto"** — `CreateProductForm` reescrito com campos estilizados (label acima + box com icone rosa: nome=pricetag, preco=cash, descricao=document com contador 0/300, estoque=cube/notifications), `CategoryField` (campo dropdown com icone grid + chevron que abre um bottom-sheet com as categorias ja usadas + digitar nova), foto em area full-width com borda tracejada ("Adicionar foto / PNG, JPG até 5MB"), e botao rosa "Cadastrar produto" com icone de check. Header do modal (em `products.tsx`) ganhou seta de voltar alem do "Fechar". `CompositeToggle`/`SaleUnitToggle` viraram dois botoes com icone (cube/gift e cube/scale), selecionado em rosa. `ComponentPicker` agora mostra os itens como **chips removiveis** (com "+N" quando ha mais de 2) + link "Adicionar produto" que abre um bottom-sheet de selecao (checkbox + stepper de quantidade); card "Custo total do kit" ganhou icone de calculadora e subtitulo "Soma dos produtos selecionados". Categorias derivadas de `useProducts`. As mudancas nos toggles e no picker tambem refletem no modal de edicao.
