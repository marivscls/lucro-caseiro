# ai.context.mobile.md — Packaging (Mobile Feature)

---

## Purpose

Gerenciar embalagens utilizadas nos produtos: cadastrar, listar, editar e excluir embalagens com tipo, custo unitario e fornecedor. Permite vincular embalagens a produtos para uso na precificacao.

## Non-goals

- Nao calcula preco final do produto (feature `pricing`).
- Nao gerencia rotulos (feature `labels`).
- Nao faz compras de embalagens (apenas cataloga).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Packaging`, `CreatePackaging`, `UpdatePackaging`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** `features/pricing` (custo de embalagem como input da precificacao).

## Code pointers

| Arquivo                                                              | Descricao                                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/mobile/src/features/packaging/api.ts`                          | Funcoes HTTP (fetchPackagingList, fetchPackaging, createPackaging, updatePackaging, deletePackaging, linkPackagingToProduct)                                       |
| `apps/mobile/src/features/packaging/hooks.ts`                        | React Query hooks                                                                                                                                                  |
| `apps/mobile/src/features/packaging/domain.ts`                       | Funcoes puras (typeLabel, typeEmoji, typeColor, typeStripeColor, totalStockCost, restockCount, packagingIllustrationSlug, PACKAGING_TYPES, PACKAGING_LIST_FILTERS) |
| `apps/mobile/src/features/packaging/components/packaging-form.tsx`   | Formulario unificado (criar + editar)                                                                                                                              |
| `apps/mobile/src/features/packaging/components/packaging-card.tsx`   | Card compacto (faixa, miniatura, chip, estoque, preco, menu)                                                                                                       |
| `apps/mobile/src/features/packaging/components/packaging-detail.tsx` | Tela de detalhe (resumo + informacoes + compartilhar)                                                                                                              |
| `apps/mobile/src/features/packaging/components/packaging-avatar.tsx` | Avatar (foto, ilustracao unica por nome, ou emoji da categoria)                                                                                                    |
| `apps/mobile/src/assets/embalagens-hero.png`                         | PNG oficial do painel (caixa kraft, sacola e rolo de etiquetas)                                                                                                    |
| `apps/mobile/src/app/packaging.tsx`                                  | Screen (rota `/packaging`)                                                                                                                                         |

## Components

### `PackagingForm`

- **Props:** `{ packaging?: Packaging | null; onSuccess?: () => void; onCancel?: () => void }`
- Mesmo componente para **criar e editar** (edita quando `packaging` esta presente).
- Em edicao mostra um **hero** (avatar + nome + "Tipo: X" + custo unitario verde).
- Secoes: "Dados da embalagem" (Nome), "Tipo de embalagem" (chips Caixa/Sacola/Pote/Filme/Rotulo/Outro
  com check no selecionado), "Custo unitario (R$)" + "Fornecedor (opcional)" (dois cards com circulo de
  icone), "Pre-visualizacao do custo" (impacto no custo total = valor digitado + barra decorativa de composicao).
- Acoes: Salvar/Cadastrar embalagem + Cancelar. Tipos mapeados: `box`, `bag`, `pot`, `film`, `label`, `other`.

### `PackagingCard`

- **Props:** `{ packaging; onPress; onEdit; onDelete }`
- Card compacto (~80px) com faixa lateral da categoria, miniatura circular,
  nome, chip de tipo, estoque/fornecedor, preço, menu e chevron. O menu de 3
  pontinhos (`ellipsis-vertical`) abre acoes (Editar / Excluir).

### `PackagingDetail`

- **Props:** `{ packaging; onDelete; isDeleting? }`
- Titulo serif (tipo), card principal (Tipo + Custo unitario verde), botao "Excluir embalagem",
  **Resumo** (3 colunas: Tipo / Custo unitario / Cadastrado), **Informacoes adicionais** (Fornecedor +
  Cadastrado em), **Baixar / Compartilhar** (Share nativo via `buildPackagingShareText`) e excluir no rodape.
- **Sem** "usado em X produtos" nem "historico de uso": o backend nao expoe contagem de uso/produtos
  vinculados (o contrato `Product` nao referencia packaging e `Packaging` nao retorna contagem). Quando
  esse dado existir (endpoint de uso), reintroduzir essas secoes.

### `PackagingAvatar`

- **Props:** `{ name; type; photoUrl?; size? }` — usa a foto quando existe, senao emoji + cor do tipo
  (`IngredientAvatar` com `matchCatalog={false}`).

## Hooks

| Hook                          | Tipo          | Descricao                                              |
| ----------------------------- | ------------- | ------------------------------------------------------ |
| `usePackagingList(opts?)`     | `useQuery`    | Lista paginada. Query key: `["packaging", opts]`       |
| `usePackaging(id)`            | `useQuery`    | Detalhe. Query key: `["packaging", id]`                |
| `useCreatePackaging()`        | `useMutation` | Cria embalagem. Invalida `["packaging"]`.              |
| `useUpdatePackaging()`        | `useMutation` | Atualiza embalagem. Invalida `["packaging"]`.          |
| `useDeletePackaging()`        | `useMutation` | Remove embalagem. Invalida `["packaging"]`.            |
| `useLinkPackagingToProduct()` | `useMutation` | Vincula embalagem a produto. Invalida `["packaging"]`. |

## API Integration

| Endpoint                                             | Verbo  | Funcao                   | Parametros              |
| ---------------------------------------------------- | ------ | ------------------------ | ----------------------- |
| `/api/v1/packaging`                                  | GET    | `fetchPackagingList`     | `?page=N`               |
| `/api/v1/packaging/:id`                              | GET    | `fetchPackaging`         | path param `id`         |
| `/api/v1/packaging`                                  | POST   | `createPackaging`        | body: `CreatePackaging` |
| `/api/v1/packaging/:id`                              | PATCH  | `updatePackaging`        | body: `UpdatePackaging` |
| `/api/v1/packaging/:id`                              | DELETE | `deletePackaging`        | -                       |
| `/api/v1/packaging/:packagingId/products/:productId` | POST   | `linkPackagingToProduct` | -                       |

## Contracts

- `Packaging` — embalagem (id, name, type, unitCost, supplier, photoUrl, createdAt).
- `CreatePackaging` — payload de criacao (name, type, unitCost, supplier?, photoUrl?).
- `UpdatePackaging` — payload de edicao.

## Error Handling

- **Erro de listagem:** EmptyState com "Nao foi possivel carregar suas embalagens. Tente novamente."
- **Erro de criacao:** `Alert.alert("Erro", message)` com mensagem da exception ou fallback.
- **Validacao local:** nome obrigatorio, custo > 0.

## Performance

- ScrollView com cards (lista pequena). Busca e filtro por tipo em memoria (`useMemo`).
- Sem cache especial alem do React Query padrao.

## Test matrix

- [x] `domain.typeLabel` mapeia cada tipo conhecido e faz fallback para o proprio valor
- [x] `domain.typeEmoji` retorna emoji por tipo (caixa como fallback)
- [x] `domain.totalStockCost` soma o custo unitario das embalagens
- [x] `domain.restockCount` e zero enquanto o contrato nao persiste estoque
- [x] `domain.packagingIllustrationSlug` gera slugs distintos por nome
- [x] `domain.buildPackagingShareText` inclui/omite fornecedor conforme presenca
- [ ] `useCreatePackaging` invalida cache apos criacao
- [ ] `PackagingForm` valida nome obrigatorio e custo > 0

## Examples

- Acessado via Home (quick access "Embalagens") ou rota `/packaging`.
- Fluxo lista: top bar (voltar + "Embalagens" + `+`) -> painel vinho (total
  cadastrado, custo investido, itens para repor + PNG `embalagens-hero.png`) ->
  busca/Filtros -> chips Todas/Caixas/Potes/Sacolas/Filmes -> "Suas embalagens"
  com contagem filtrada -> cards -> CTA tracejado "Adicionar nova embalagem".
- Fluxo detalhe: card -> modal detalhe (Fechar/Editar) -> "Editar" abre o form de edicao
  (voltar + "Editar embalagem" + Excluir no topo).

## Change log / Decisions

- Limite freemium: 3 embalagens no Free, ilimitado no Premium (enforcement no backend).
- Link entre embalagem e produto via endpoint dedicado (POST /packaging/:id/products/:productId).
- 2026-06-15: **redesign completo das 3 telas** (lista, detalhe, editar) para baterem com os mockups.
  Novos: `domain.ts` (+ testes), `packaging-card.tsx`, `packaging-form.tsx` (criar+editar unificado),
  `packaging-detail.tsx`, `packaging-avatar.tsx`. Removido `create-packaging-form.tsx`.
  Lista ganhou busca, filtro por tipo, 2 cards de resumo (total + `totalStockCost`) e CTA tracejado.
- **Fornecedor (Fase 2)**: o campo de fornecedor (antes texto livre) virou o `SupplierSelector` da feature `suppliers` (escreve `supplierId`). O detalhe mostra o nome do fornecedor vinculado (via `useSupplierName`), com fallback pro texto legado `supplier`.
  Cada tipo tem cor propria (Caixa=blue, Sacola/Rotulo=premium, Pote=lavender, Filme=success, Outro=neutro).
  **Pendencia de backend:** "usado em X produtos" e "historico de uso" (vistos nos mockups) nao existem
  no contrato atual — omitidos para nao inventar dados. Reintroduzir quando houver endpoint de uso.
- 2026-08-18: filtros por tipo da lista usam o `Chip` compartilhado com badge
  de contagem local. O estado selecionado segue o rosa de marca, não a cor
  semântica de cada tipo.
- 2026-08-22: a lista passou a um painel vinho (`wineFill`) com o PNG oficial
  `embalagens-hero.png`, busca + Filtros, chips horizontais (Todas / Caixas /
  Potes / Sacolas / Filmes) e cards compactos com faixa por categoria. Totais
  vêm dos dados reais: cadastradas = `total`, investidos = `totalStockCost`,
  para repor = `restockCount` (zero enquanto o contrato não persiste estoque).
  Miniaturas usam `photoUrl` ou slug único do nome; o botão `+` e as rotas
  permaneceram iguais.
- 2026-08-24: estado vazio da lista deixou de usar ilustração PNG.
