# ai.context.mobile.md — Materials (Insumos)

---

## Purpose

Catálogo + estoque de matéria-prima (insumos): listar/buscar, criar/editar, ajustar
estoque rápido (+/−) e ver alerta de estoque baixo. Separado dos produtos acabados.

## Non-goals

- Não dá baixa automática por receita/produção (futuro).
- Não controla lotes/validade.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (Material, CreateMaterial, UpdateMaterial, AdjustMaterial), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** `app/materials` (tela), `app/tabs/more` (entrada).

## Code pointers

| Arquivo                                                           | Descricao                        |
| ----------------------------------------------------------------- | -------------------------------- |
| `apps/mobile/src/features/materials/api.ts`                       | Funcoes HTTP                     |
| `apps/mobile/src/features/materials/hooks.ts`                     | React Query hooks                |
| `apps/mobile/src/features/materials/types.ts`                     | Re-export dos tipos de contracts |
| `apps/mobile/src/features/materials/domain.ts`                    | Badge de estoque, formatação     |
| `apps/mobile/src/features/materials/domain.test.ts`               | Testes do dominio                |
| `apps/mobile/src/features/materials/components/material-card.tsx` | Card com badge e botoes +/-      |
| `apps/mobile/src/features/materials/components/material-form.tsx` | Formulario criar/editar/excluir  |
| `apps/mobile/src/app/materials.tsx`                               | Tela `/materials`                |

## Components

### `MaterialCard`

- **Props:** `{ material: Material; onPress?: () => void }`
- Mostra nome, badge de estoque (ok/baixo/sem) e custo/unidade. Botões **+/−** ajustam o estoque em 1 (via `useAdjustMaterial`). Tap no nome abre edição.

### `MaterialForm`

- **Props:** `{ material?: Material | null; onSuccess?: () => void }`
- Cria/edita: nome, unidade (chips kg/g/L/ml/un/dz), quantidade, alerta, custo, **conteúdo por unidade (opcional)**, notas. Em edição mostra "Excluir".
- **#14 Conteúdo por unidade (opcional):** seção com quantidade + unidade curta (ex.: 350 + "ml"),
  helper "Ex.: 1 lata = 350 ml. Permite usar este insumo em g/ml nas receitas." Validação local:
  ou os dois preenchidos, ou os dois em branco. Envia `contentPerUnit`/`contentUnit` (number/string)
  ou `null` para limpar.

## Hooks

| Hook                     | Tipo          | Descricao                                                          |
| ------------------------ | ------------- | ------------------------------------------------------------------ |
| `useMaterials(opts?)`    | `useQuery`    | Lista paginada. Query key: `["materials", opts]`.                  |
| `useLowStockMaterials()` | `useQuery`    | Insumos abaixo do alerta. Query key: `["materials", "low-stock"]`. |
| `useCreateMaterial()`    | `useMutation` | Cria. Invalida `["materials"]`.                                    |
| `useUpdateMaterial()`    | `useMutation` | Atualiza. Invalida `["materials"]`.                                |
| `useAdjustMaterial()`    | `useMutation` | Ajusta estoque (delta). Invalida `["materials"]`.                  |
| `useDeleteMaterial()`    | `useMutation` | Remove. Invalida `["materials"]`.                                  |

## API Integration

| Endpoint                       | Verbo  | Funcao                   | Parametros             |
| ------------------------------ | ------ | ------------------------ | ---------------------- |
| `/api/v1/materials`            | GET    | `fetchMaterials`         | `?page=&search=`       |
| `/api/v1/materials/low-stock`  | GET    | `fetchLowStockMaterials` | -                      |
| `/api/v1/materials`            | POST   | `createMaterial`         | body: `CreateMaterial` |
| `/api/v1/materials/:id`        | PATCH  | `updateMaterial`         | body: `UpdateMaterial` |
| `/api/v1/materials/:id/adjust` | POST   | `adjustMaterial`         | body: `{ delta }`      |
| `/api/v1/materials/:id`        | DELETE | `deleteMaterial`         | -                      |

## Contracts

- `Material` — `{ id, userId, name, unit, stockQuantity, stockAlertThreshold, costPerUnit, contentPerUnit, contentUnit, notes, createdAt }`.
- `CreateMaterial` / `UpdateMaterial` — payloads.
- `AdjustMaterial` — `{ delta }`.

## Error Handling

- **Erro ao salvar:** `Alert.alert("Erro", "Não foi possível salvar o insumo. Tente novamente.")`.
- **Validação local:** nome obrigatório.

## Performance

- Lista paginada; badge/derivações no client.

## Test matrix

- [ ] `stockBadge`: sem estoque / baixo / ok
- [ ] `formatQty` / `formatCost`
- [ ] `MaterialForm` valida nome
- [ ] Ajuste +/- chama `useAdjustMaterial`

## Examples

- Mais → "Insumos" → tela `/materials`. FAB "Novo insumo". Card: +/- ajusta estoque; tap edita.

## Change log / Decisions

- Criação inicial: catálogo + estoque de insumos com ajuste rápido e alerta de baixo.
- v1 standalone (sem baixa automática por receita — futuro).
- **#14 Conteúdo por unidade (LIGHT)**: form ganhou seção opcional (quantidade + unidade) para
  declarar quanto cabe em 1 unidade (ex.: 1 lata = 350 ml). Habilita escolha de unidade na
  linha de receita (ver feature `recipes`). Sem conteúdo, comportamento inalterado.
- 2026-06-10: unidades de papelaria/artesanato no form: folha, m, cm.
