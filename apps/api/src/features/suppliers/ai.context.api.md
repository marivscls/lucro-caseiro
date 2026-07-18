# ai.context.api.md — Suppliers

---

## Purpose

Gerenciar o cadastro de fornecedores do negocio (nome, telefone, email, endereco e notas). Substitui o antigo campo de texto livre `supplier` que existia em ingredients/packaging por uma entidade reutilizavel, escopada por usuario.

## Non-goals

- Nao registra compras nem contas a pagar (isso pertence a feature Purchases — fase futura)
- Nao cria lancamento financeiro (isso pertence a feature Finance)
- Nao faz integracao com WhatsApp (apenas guarda o telefone)
- Nao faz enforcement de limites freemium internamente (isso e feito via Subscription/freemiumGuard)

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateSupplierDto, UpdateSupplierDto, PaginationDto, Supplier), `@lucro-caseiro/database/schema` (suppliers table)
- **Dependentes**: Subscription (conta fornecedores para limites freemium); Materials e Packaging referenciam `supplierId` (FK opcional, ON DELETE SET NULL — migration `021`); Purchases referencia `supplierId` (FK opcional — migration `022`)
- **Nao importa**: nenhuma outra feature interna

## Code pointers

- `apps/api/src/features/suppliers/suppliers.routes.ts` — rotas Express
- `apps/api/src/features/suppliers/suppliers.usecases.ts` — logica de negocio
- `apps/api/src/features/suppliers/suppliers.domain.ts` — validacoes e funcoes puras
- `apps/api/src/features/suppliers/suppliers.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/suppliers/suppliers.types.ts` — interfaces e tipos
- `apps/api/src/features/suppliers/suppliers.domain.test.ts` — testes de dominio
- `apps/api/src/features/suppliers/suppliers.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `suppliers`

| Coluna    | Tipo      | Constraints        |
| --------- | --------- | ------------------ |
| id        | uuid      | PK                 |
| userId    | uuid      | FK users, NOT NULL |
| name      | text      | NOT NULL           |
| phone     | text      | nullable           |
| email     | text      | nullable           |
| address   | text      | nullable           |
| notes     | text      | nullable           |
| createdAt | timestamp | default now()      |

## Invariants

- Nome do fornecedor e obrigatorio (trim > 0 caracteres)
- Nome do fornecedor deve ter no maximo 200 caracteres
- Telefone, quando presente, deve ter entre 8 e 15 digitos (ignorando caracteres nao numericos)
- Email, quando presente, deve ser valido
- Toda query e escopada por `userId` — nunca retorna fornecedores de outro usuario
- Delete e fisico (hard delete)

## Operations

```yaml
feature: suppliers
app: api
mobile_counterpart: suppliers
api:
  base: /api/v1/suppliers
  endpoints:
    - method: POST
      path: /
      dto: CreateSupplierDto
      response: Supplier (201)
    - method: GET
      path: /
      query: page, limit, search
      dto: PaginationDto
      response: { items: Supplier[], total, page, totalPages }
    - method: GET
      path: /:id
      response: Supplier
    - method: PATCH
      path: /:id
      dto: UpdateSupplierDto
      response: Supplier
    - method: DELETE
      path: /:id
      response: 204
db:
  tables:
    - suppliers
  indexes:
    - (userId)
    - (userId, name)
invariants:
  - name.trim().length > 0
  - name.length <= 200
  - phone digits entre 8 e 15 (quando presente)
  - email valido (quando presente)
  - todas as queries escopadas por userId
freemium:
  resource: suppliers
  free_limit: 3
  enforced_by: freemiumGuard(subscriptionRepo, "suppliers") no POST /
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT via `getUserId(req)`
- Toda query filtra por `userId` — isolamento por tenant garantido no repo

## Contracts (Zod/DTO)

- **CreateSupplierDto** (de `@lucro-caseiro/contracts`): `{ name, phone?, email?, address?, notes? }`
- **UpdateSupplierDto** (de `@lucro-caseiro/contracts`): `Partial<CreateSupplierDto>`
- **PaginationDto** (de `@lucro-caseiro/contracts`): `{ page, limit }`
- **Supplier** (de `@lucro-caseiro/contracts`): `{ id, userId, name, phone, email, address, notes, createdAt }`

## Errors

| Status | Quando                                                | Mensagem                                |
| ------ | ----------------------------------------------------- | --------------------------------------- |
| 400    | Dados invalidos (nome vazio, telefone/email invalido) | Array de strings com erros de validacao |
| 403    | Limite freemium de fornecedores atingido (free)       | LIMIT_EXCEEDED (mensagem de upgrade)    |
| 404    | Fornecedor nao encontrado (getById, update, remove)   | "Fornecedor nao encontrado"             |

## Events / Side effects

- Nenhum evento async ou side effect

## Performance

- Listagem usa paginacao com `LIMIT/OFFSET`
- Busca por nome e telefone via `ILIKE`
- Contagem paralela com `Promise.all`

## Security

- Dados de fornecedores incluem contato (telefone/email) — tratados com isolamento por `userId`
- Isolamento por `userId` impede acesso cruzado

## Test matrix

### Domain (suppliers.domain.test.ts)

- validateSupplierData: nome vazio, nome > 200, telefone < 8 ou > 15 digitos, telefone vazio, email valido, email invalido, email vazio

### UseCases (suppliers.usecases.test.ts)

- create: dados validos, ValidationError para nome vazio
- getById: encontrado, NotFoundError
- list: paginacao
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError

## Examples

```
POST /api/v1/suppliers
{ "name": "Atacadão da Festa", "phone": "11999887766", "email": "contato@atacadao.com" }
=> 201 { "id": "...", "name": "Atacadão da Festa", ... }

GET /api/v1/suppliers?page=1&limit=20&search=atacad
=> 200 { "items": [...], "total": 2, "page": 1, "totalPages": 1 }
```

## Change log / Decisions

- Criacao inicial da feature com CRUD completo
- Limite freemium: 3 fornecedores no plano gratuito, ilimitado no Premium
- Fase 2 (migration `021_supplier_links.sql`): `materials.supplier_id` e `packaging.supplier_id`
  passam a referenciar suppliers (FK opcional, ON DELETE SET NULL). Excluir um fornecedor solta
  os vínculos, não bloqueia. O mobile usa um `SupplierSelector` reutilizável nos forms de insumo/embalagem.
