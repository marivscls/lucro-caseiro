# ai.context.api.md — Packaging

---

## Purpose

Gerenciar o catalogo de embalagens usadas no negocio caseiro (caixas, sacolas, potes, filmes, etiquetas, etc.), incluindo custo unitario e fornecedor. Permite vincular embalagens a produtos via tabela de associacao.

## Non-goals

- Nao controla estoque de embalagens
- Nao calcula custo total de embalagem por produto (isso e feito na feature Pricing)
- Nao faz pedidos de compra para fornecedores

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreatePackagingDto, UpdatePackagingDto, PaginationDto, Packaging), `@lucro-caseiro/database/schema` (packaging, productPackaging)
- **Dependentes**: Pricing (usa custo de embalagem), Products (vinculo produto-embalagem), Subscription (conta embalagens para limites freemium)
- **Nao importa**: nenhuma outra feature interna

## Code pointers

- `apps/api/src/features/packaging/packaging.routes.ts` — rotas Express
- `apps/api/src/features/packaging/packaging.usecases.ts` — logica de negocio
- `apps/api/src/features/packaging/packaging.domain.ts` — validacoes
- `apps/api/src/features/packaging/packaging.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/packaging/packaging.types.ts` — interfaces e tipos
- `apps/api/src/features/packaging/packaging.domain.test.ts` — testes de dominio
- `apps/api/src/features/packaging/packaging.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `packaging`

| Coluna    | Tipo      | Constraints                                                       |
| --------- | --------- | ----------------------------------------------------------------- |
| id        | uuid      | PK                                                                |
| userId    | uuid      | FK users, NOT NULL                                                |
| name      | varchar   | NOT NULL                                                          |
| type      | enum      | "box" \| "bag" \| "pot" \| "film" \| "label" \| "other", NOT NULL |
| unitCost  | decimal   | NOT NULL                                                          |
| supplier  | varchar   | nullable                                                          |
| photoUrl  | varchar   | nullable                                                          |
| createdAt | timestamp | default now()                                                     |

### Tabela: `product_packaging` (associacao N:N)

| Coluna      | Tipo | Constraints                          |
| ----------- | ---- | ------------------------------------ |
| packagingId | uuid | FK packaging, NOT NULL               |
| productId   | uuid | FK products, NOT NULL                |
|             |      | PK composta (packagingId, productId) |

## Invariants

- Nome da embalagem e obrigatorio (trim > 0 caracteres)
- Nome da embalagem deve ter no maximo 200 caracteres
- Custo unitario deve ser maior que zero
- Toda query escopada por `userId`
- Link produto-embalagem usa `ON CONFLICT DO NOTHING` (idempotente)

## Operations

```yaml
feature: packaging
app: api
mobile_counterpart: packaging
api:
  base: /api/v1/packaging
  endpoints:
    - method: POST
      path: /
      dto: CreatePackagingDto
      response: Packaging (201)
    - method: GET
      path: /
      query: page, limit, search
      dto: PaginationDto
      response: { items: Packaging[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Packaging
    - method: PATCH
      path: /:id
      dto: UpdatePackagingDto
      response: Packaging
    - method: DELETE
      path: /:id
      response: 204
    - method: POST
      path: /:id/products/:productId
      response: 204 (link)
    - method: DELETE
      path: /:id/products/:productId
      response: 204 (unlink)
db:
  tables:
    - packaging
    - productPackaging
  indexes:
    - (userId, id)
    - (userId, createdAt DESC)
    - productPackaging(packagingId, productId) PK
invariants:
  - name.trim().length > 0
  - name.length <= 200
  - unitCost > 0
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Toda query filtra por `userId`
- Link/unlink verifica ownership da embalagem antes de operar

## Contracts (Zod/DTO)

- **CreatePackagingDto**: `{ name, type: "box"|"bag"|"pot"|"film"|"label"|"other", unitCost, supplier?, photoUrl? }`
- **UpdatePackagingDto**: `Partial<CreatePackagingDto>`
- **Packaging**: `{ id, userId, name, type, unitCost, supplier, photoUrl, createdAt }`

## Errors

| Status | Quando                          | Mensagem                   |
| ------ | ------------------------------- | -------------------------- |
| 400    | Nome vazio, custo <= 0          | Array de strings com erros |
| 404    | Embalagem nao encontrada        | "Embalagem nao encontrada" |
| 404    | Vinculo nao encontrado (unlink) | "Vinculo nao encontrado"   |

## Events / Side effects

- Nenhum

## Performance

- Busca por nome via `ILIKE` + paginacao
- Link usa `ON CONFLICT DO NOTHING` — insercao idempotente

## Security

- Isolamento por `userId`

## Test matrix

### Domain (packaging.domain.test.ts)

- validatePackagingData: nome vazio, nome > 200, custo zero, custo negativo, acumulo

### UseCases (packaging.usecases.test.ts)

- create: dados validos, ValidationError
- getById: encontrado, NotFoundError
- list: paginacao
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError
- linkToProduct: sucesso, NotFoundError (embalagem inexistente)
- unlinkFromProduct: sucesso, NotFoundError (embalagem inexistente), NotFoundError (vinculo inexistente)

## Examples

```
POST /api/v1/packaging
{ "name": "Caixa Kraft", "type": "box", "unitCost": 1.50, "supplier": "Embalagens ABC" }
=> 201 { "id": "...", "name": "Caixa Kraft", "unitCost": 1.5, ... }

POST /api/v1/packaging/pkg-1/products/prod-1
=> 204

DELETE /api/v1/packaging/pkg-1/products/prod-1
=> 204
```

## Change log / Decisions

- Criacao inicial com CRUD + link/unlink produto-embalagem
- Tipos de embalagem definidos como enum: box, bag, pot, film, label, other
