# PRD: Insumos (Matéria-prima) — Lucro Caseiro

> Status: **Planejado** (spec). Implementação após a Agenda.
> Origem: pergunta do usuário "tem aba de materiais/insumos?". Hoje só existem
> **ingredientes dentro das receitas** (com custo, p/ precificação) e **embalagens** —
> não há **estoque de matéria-prima** (farinha, açúcar, etc.).

## Introdução

Insumos é o **catálogo + estoque de matéria-prima** do negócio: o que se compra pra
produzir (farinha, açúcar, leite condensado, caixinhas...). Permite saber **quanto tem**,
**quanto custa** e ser **avisado quando está acabando** — separado dos **produtos acabados**
(que já têm estoque próprio).

## Goals

- Cadastrar insumos com **unidade** (kg, g, L, ml, un, dz...), **quantidade em estoque**,
  **custo por unidade** e **alerta de estoque baixo**.
- **Ajustar estoque** rápido (entrada de compra / baixa de uso).
- **Alerta de insumo baixo** (lista + notificação local).
- Base para, no futuro, **receitas consumirem insumos** e darem baixa automática.

## Non-goals

- v1 **não** faz baixa automática a partir de receitas/produção (fica p/ v2).
- Não controla lotes/validade.
- Não substitui os **ingredientes** das receitas (que seguem para precificação).
  Integração receita↔insumo é v2.

## Data Model

### Nova tabela: `materials`

| Coluna              | Tipo      | Constraints                                |
| ------------------- | --------- | ------------------------------------------ |
| id                  | uuid      | PK                                         |
| userId              | uuid      | FK users, NOT NULL                         |
| name                | text      | NOT NULL                                   |
| unit                | text      | NOT NULL (ex.: "kg", "g", "L", "ml", "un") |
| stockQuantity       | decimal   | NOT NULL default 0                         |
| stockAlertThreshold | decimal   | nullable                                   |
| costPerUnit         | decimal   | nullable (custo por unidade)               |
| notes               | text      | nullable                                   |
| createdAt           | timestamp | default now()                              |

- Índices: `(userId)`, `(userId, name)`. Escopado por `userId`.

## Invariants

- `name` obrigatório; `unit` obrigatório.
- `stockQuantity` >= 0; `stockAlertThreshold` >= 0 (quando presente); `costPerUnit` >= 0.
- "Baixo" = `stockQuantity <= stockAlertThreshold` (quando threshold definido) — derivado.
- Ajuste de estoque nunca deixa `stockQuantity` negativo (clamp em 0).

## Operations (API — nova feature `materials`)

```yaml
feature: materials
app: api
mobile_counterpart: materials
api:
  base: /api/v1/materials
  endpoints:
    - method: GET
      path: /
      query: search?
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
      body: { delta: number }     # +entrada / -baixa; clamp >= 0
      response: Material
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [materials]
  indexes: [(userId), (userId, name)]
invariants:
  - name/unit obrigatorios
  - stockQuantity >= 0; threshold/cost >= 0
```

## Contracts (Zod/DTO) — `packages/contracts`

- **CreateMaterialDto**: `{ name, unit, stockQuantity?, stockAlertThreshold?, costPerUnit?, notes? }`
- **UpdateMaterialDto**: `Partial<CreateMaterialDto>`
- **AdjustMaterialDto**: `{ delta: number }`
- **Material**: `{ id, userId, name, unit, stockQuantity, stockAlertThreshold, costPerUnit, notes, createdAt }`

## Mobile — nova feature `materials`

Arquivos: `api.ts`, `hooks.ts`, `types.ts`, `domain.ts`, `components/material-card.tsx`,
`components/material-form.tsx`, `ai.context.mobile.md`. Tela `/materials` (rota), acessível
por **Mais** e quick-access da Home.

- Lista com badge de estoque (ok / baixo / zerado) e botões rápidos **+ / −** (ajuste).
- Form de criar/editar (nome, unidade, qtd, alerta, custo).
- Reaproveita o padrão visual de Produtos.
- (Opcional v1) banner/alerta de insumos baixos; notificação local pode reusar/estender
  o padrão do estoque de produtos.

## Freemium — recomendação

Insumos é utilitário core → **grátis** na v1 (sem limite), consistente com a meta de
pró-labore e a agenda. Limite freemium pode ser avaliado depois se necessário.

## Test matrix

- Domain (API): validação (name/unit, valores >= 0), clamp do ajuste em 0.
- UseCases (API): create/get/list/update/remove; adjust (+/−, clamp); low-stock filter.
- Mobile: `material-card` (badges), `material-form` (validação), ajuste +/−.

## Passos de implementação (ordem)

1. contracts (DTOs + tipos).
2. database: schema `materials` + migration.
3. API feature `materials`: domain (+testes) → repo.pg → usecases → routes → wire. ai.context.api.md.
4. Mobile feature `materials`: api/hooks/types/domain + componentes + tela + entrada em Mais. ai.context.mobile.md.
5. `pnpm context:lint` + `pnpm prepush`. Commits por camada (`feat(materials): ...`).
6. Migration `materials` no banco de produção (SQL no Supabase).

## Futuro (v2)

- Receita referencia insumos (qtd por porção) → ao produzir/entregar encomenda, **dá baixa**
  nos insumos automaticamente. Liga Agenda ↔ Receitas ↔ Insumos.
- Custo do produto calculado a partir do custo real dos insumos.
