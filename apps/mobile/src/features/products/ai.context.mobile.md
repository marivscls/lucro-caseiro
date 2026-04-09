# ai.context.mobile.md — Products (Mobile Feature)

---

## Purpose

Catalogo de produtos do usuario: listar, buscar, criar, editar e excluir produtos com nome, categoria, preco de venda, descricao, controle de estoque e alerta de estoque baixo.

## Non-goals

- Nao calcula preco de venda (feature `pricing`).
- Nao gerencia receitas associadas (feature `recipes`).
- Nao registra vendas (feature `sales`).
- Upload de foto planejado mas nao implementado (botao "em breve").

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Product`, `CreateProduct`, `UpdateProduct`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** `features/sales` (tela `new-sale` usa `useProducts` para selecionar produtos no carrinho), `features/labels` (rotulos podem ser vinculados a produtos).

## Code pointers

| Arquivo                                                                | Descricao                                                                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/products/api.ts`                             | Funcoes HTTP (fetchProducts, fetchProduct, createProduct, updateProduct, deleteProduct) |
| `apps/mobile/src/features/products/hooks.ts`                           | React Query hooks                                                                       |
| `apps/mobile/src/features/products/components/create-product-form.tsx` | Formulario de criacao                                                                   |
| `apps/mobile/src/features/products/components/product-card.tsx`        | Card de produto na listagem                                                             |
| `apps/mobile/src/features/products/components/product-list.tsx`        | Lista de produtos                                                                       |
| `apps/mobile/src/app/products.tsx`                                     | Screen (rota `/products`) com modal de detalhe/edicao inline                            |

## Components

### `ProductCard`

- **Props:** `{ product: Product; onPress?: () => void }`
- Exibe foto ou avatar com inicial, nome, categoria, preco de venda e badge de estoque (sem estoque/estoque baixo/quantidade).

### `ProductList`

- **Props:** `{ category?: string; search?: string; onProductPress?: (id: string) => void; onAddPress?: () => void }`
- FlatList com contador de total.
- EmptyState quando sem dados.

### `CreateProductForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), categoria (obrigatorio), preco de venda (obrigatorio, > 0), foto (botao "em breve"), descricao, quantidade em estoque, alerta de estoque baixo.

### `ProductDetailModal` (definido no screen)

- Modal inline no arquivo `products.tsx` com visualizacao e edicao do produto.
- Exibe avatar, nome, categoria, preco, descricao.
- Modo edicao com campos editaveis.
- Botao de excluir com confirmacao.

## Hooks

| Hook                 | Tipo          | Descricao                                       |
| -------------------- | ------------- | ----------------------------------------------- |
| `useProducts(opts?)` | `useQuery`    | Lista paginada. Query key: `["products", opts]` |
| `useProduct(id)`     | `useQuery`    | Detalhe. Query key: `["products", id]`          |
| `useCreateProduct()` | `useMutation` | Cria produto. Invalida `["products"]`.          |
| `useUpdateProduct()` | `useMutation` | Atualiza produto. Invalida `["products"]`.      |
| `useDeleteProduct()` | `useMutation` | Remove produto. Invalida `["products"]`.        |

## API Integration

| Endpoint               | Verbo  | Funcao          | Parametros                                 |
| ---------------------- | ------ | --------------- | ------------------------------------------ |
| `/api/v1/products`     | GET    | `fetchProducts` | `?page=N&limit=N&category=cat&search=term` |
| `/api/v1/products/:id` | GET    | `fetchProduct`  | path param `id`                            |
| `/api/v1/products`     | POST   | `createProduct` | body: `CreateProduct`                      |
| `/api/v1/products/:id` | PATCH  | `updateProduct` | body: `UpdateProduct`                      |
| `/api/v1/products/:id` | DELETE | `deleteProduct` | -                                          |

## Contracts

- `Product` — produto (id, name, category, salePrice, description, photoUrl, stockQuantity, stockAlertThreshold).
- `CreateProduct` — payload de criacao (name, category, salePrice, description?, stockQuantity?, stockAlertThreshold?).
- `UpdateProduct` — payload de edicao.

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
- [ ] `CreateProductForm` valida nome obrigatorio
- [ ] `CreateProductForm` valida preco > 0
- [ ] `ProductCard` exibe badge de estoque correto
- [ ] Exclusao de produto com confirmacao
- [ ] Edicao inline no modal

## Examples

- Acessado via Home (quick access "Produtos") ou rota `/products`.
- Fluxo: lista -> FAB "Novo produto" -> modal criacao -> salvar.
- Tap em produto -> modal detalhe -> editar -> salvar.

## Change log / Decisions

- Detalhe/edicao do produto implementado como modal inline no screen (nao como componente separado na feature).
- Upload de foto e em breve ("em breve").
