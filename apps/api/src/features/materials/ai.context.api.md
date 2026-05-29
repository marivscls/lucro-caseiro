# ai.context.api.md — Materials (Insumos / Matéria-prima)

---

## Purpose

Catálogo + estoque de **matéria-prima** (insumos): cadastrar, listar/buscar, ajustar
estoque (entrada/baixa), alertar quando está baixo. Separado dos **produtos acabados**
(que têm estoque próprio).

## Non-goals

- v1 não dá baixa automática a partir de receitas/produção (futuro).
- Não controla lotes/validade.
- Não substitui os ingredientes das receitas (precificação).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateMaterialDto, UpdateMaterialDto, AdjustMaterialDto, Material, PaginationDto), `@lucro-caseiro/database/schema` (materials).
- **Dependentes**: nenhum (consumido pelo mobile). Sem acoplamento com outras features.

## Code pointers

- `apps/api/src/features/materials/materials.routes.ts` — rotas Express
- `apps/api/src/features/materials/materials.usecases.ts` — lógica
- `apps/api/src/features/materials/materials.domain.ts` — validação, clampStock
- `apps/api/src/features/materials/materials.repo.pg.ts` — persistência (ajuste com greatest(0,...))
- `apps/api/src/features/materials/materials.types.ts` — interfaces
- `apps/api/src/features/materials/materials.domain.test.ts` / `materials.usecases.test.ts`

## Data Model

### Tabela: `materials`

| Coluna              | Tipo      | Constraints                    |
| ------------------- | --------- | ------------------------------ |
| id                  | uuid      | PK                             |
| userId              | uuid      | FK users, NOT NULL             |
| name                | text      | NOT NULL                       |
| unit                | text      | NOT NULL (kg, g, L, ml, un...) |
| stockQuantity       | decimal   | NOT NULL default 0 (12,3)      |
| stockAlertThreshold | decimal   | nullable (12,3)                |
| costPerUnit         | decimal   | nullable (10,2)                |
| notes               | text      | nullable                       |
| createdAt           | timestamp | default now()                  |

- Índices: `(userId)`, `(userId, name)`. Schema via `drizzle-kit push`.

## Invariants

- `name` e `unit` obrigatórios.
- `stockQuantity` >= 0; `stockAlertThreshold`/`costPerUnit` >= 0 quando presentes.
- Ajuste (`adjust`) faz `greatest(0, estoque + delta)` — nunca fica negativo.
- "Baixo" = `stockAlertThreshold` definido e `stockQuantity <= stockAlertThreshold`.
- Toda query escopada por `userId`.

## Operations

```yaml
feature: materials
app: api
mobile_counterpart: materials
api:
  base: /api/v1/materials
  endpoints:
    - method: GET
      path: /
      query: page, limit, search?
      dto: PaginationDto
      response: { items: Material[], total, page, totalPages }
    - method: GET
      path: /low-stock
      response: Material[]
    - method: POST
      path: /
      dto: CreateMaterialDto
      response: Material (201)
    - method: GET
      path: /:id
      response: Material
    - method: PATCH
      path: /:id
      dto: UpdateMaterialDto
      response: Material
    - method: POST
      path: /:id/adjust
      dto: AdjustMaterialDto   # { delta }
      response: Material
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [materials]
  indexes: [(userId), (userId, name)]
```

## Authorization & RLS

- Rotas protegidas por `authMiddleware`; `userId` via `getUserId(req)`. Isolamento por `userId`.

## Contracts (Zod/DTO)

- **CreateMaterialDto**: `{ name, unit, stockQuantity?, stockAlertThreshold?, costPerUnit?, notes? }`
- **UpdateMaterialDto**: `Partial<CreateMaterialDto>`
- **AdjustMaterialDto**: `{ delta: number }`
- **Material**: `{ id, userId, name, unit, stockQuantity, stockAlertThreshold, costPerUnit, notes, createdAt }`

## Errors

| Status | Quando                           | Mensagem                |
| ------ | -------------------------------- | ----------------------- |
| 400    | nome/unidade vazios, valores < 0 | Array de strings        |
| 404    | insumo não encontrado            | "Insumo nao encontrado" |

## Security

- Isolamento por `userId` em todas as queries.

## Events / Side effects

- Nenhum (CRUD + ajuste de estoque).

## Performance

- Listagem paginada com busca (ilike) e ordenação por nome.

## Test matrix

### Domain (materials.domain.test.ts)

- validateMaterial: válido, nome/unidade obrigatórios, valores negativos, modo parcial
- clampStock: negativo → 0

### UseCases (materials.usecases.test.ts)

- create válido / ValidationError; getById NotFound; list paginada; lowStock; adjust; adjust NotFound

## Examples

```
POST /api/v1/materials
{ "name": "Farinha de trigo", "unit": "kg", "stockQuantity": 10, "stockAlertThreshold": 3, "costPerUnit": 4.50 }
=> 201 { "id": "...", ... }

POST /api/v1/materials/:id/adjust
{ "delta": -2 }   => estoque desce 2 (mínimo 0)
```

## Change log / Decisions

- Criação inicial: catálogo + estoque de insumos com ajuste e low-stock.
- v1 standalone (sem baixa automática por receita/produção — futuro liga Receitas↔Insumos↔Agenda).
