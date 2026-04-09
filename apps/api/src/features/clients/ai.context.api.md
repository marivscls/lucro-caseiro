# ai.context.api.md — Clients

---

## Purpose

Gerenciar o cadastro de clientes do negocio caseiro, permitindo registrar nome, telefone, endereco, aniversario, notas e tags. Tambem oferece busca por aniversariantes do mes e formatacao de telefone para WhatsApp.

## Non-goals

- Nao gerencia historico de compras do cliente (isso pertence a feature Sales)
- Nao envia notificacoes ou mensagens para clientes
- Nao faz integracao com WhatsApp (apenas formata o numero)
- Nao faz enforcement de limites freemium (isso e feito via Subscription)

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateClientDto, UpdateClientDto, PaginationDto, Client), `@lucro-caseiro/database/schema` (clients table)
- **Dependentes**: Sales (referencia clientId), Subscription (conta clientes para limites freemium)
- **Nao importa**: nenhuma outra feature interna

## Code pointers

- `apps/api/src/features/clients/clients.routes.ts` — rotas Express
- `apps/api/src/features/clients/clients.usecases.ts` — logica de negocio
- `apps/api/src/features/clients/clients.domain.ts` — validacoes e funcoes puras
- `apps/api/src/features/clients/clients.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/clients/clients.types.ts` — interfaces e tipos
- `apps/api/src/features/clients/clients.domain.test.ts` — testes de dominio
- `apps/api/src/features/clients/clients.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `clients`

| Coluna     | Tipo      | Constraints                   |
| ---------- | --------- | ----------------------------- |
| id         | uuid      | PK                            |
| userId     | uuid      | FK users, NOT NULL            |
| name       | varchar   | NOT NULL                      |
| phone      | varchar   | nullable                      |
| address    | varchar   | nullable                      |
| birthday   | varchar   | nullable (formato YYYY-MM-DD) |
| notes      | text      | nullable                      |
| tags       | text[]    | default []                    |
| totalSpent | decimal   | default 0                     |
| createdAt  | timestamp | default now()                 |

## Invariants

- Nome do cliente e obrigatorio (trim > 0 caracteres)
- Nome do cliente deve ter no maximo 200 caracteres
- Telefone, quando presente, deve ter entre 8 e 15 digitos (ignorando caracteres nao numericos)
- Toda query e escopada por `userId` — nunca retorna clientes de outro usuario
- Delete e fisico (hard delete)

## Operations

```yaml
feature: clients
app: api
mobile_counterpart: clients
api:
  base: /api/v1/clients
  endpoints:
    - method: POST
      path: /
      dto: CreateClientDto
      response: Client (201)
    - method: GET
      path: /
      query: page, limit, search
      dto: PaginationDto
      response: { items: Client[], total, page, totalPages }
    - method: GET
      path: /birthdays
      response: Client[]
    - method: GET
      path: /:id
      response: Client
    - method: PATCH
      path: /:id
      dto: UpdateClientDto
      response: Client
    - method: DELETE
      path: /:id
      response: 204
db:
  tables:
    - clients
  indexes:
    - (userId, id)
    - (userId, createdAt DESC)
invariants:
  - name.trim().length > 0
  - name.length <= 200
  - phone digits entre 8 e 15 (quando presente)
  - todas as queries escopadas por userId
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT via `getUserId(req)`
- Toda query filtra por `userId` — isolamento por tenant garantido no repo

## Contracts (Zod/DTO)

- **CreateClientDto** (de `@lucro-caseiro/contracts`): `{ name, phone?, address?, birthday?, notes?, tags? }`
- **UpdateClientDto** (de `@lucro-caseiro/contracts`): `Partial<CreateClientDto>`
- **PaginationDto** (de `@lucro-caseiro/contracts`): `{ page, limit }`
- **Client** (de `@lucro-caseiro/contracts`): `{ id, userId, name, phone, address, birthday, notes, tags, totalSpent, createdAt }`

## Errors

| Status | Quando                                           | Mensagem                                |
| ------ | ------------------------------------------------ | --------------------------------------- |
| 400    | Dados invalidos (nome vazio, telefone invalido)  | Array de strings com erros de validacao |
| 404    | Cliente nao encontrado (getById, update, remove) | "Cliente nao encontrado"                |

## Events / Side effects

- Nenhum evento async ou side effect

## Performance

- Listagem usa paginacao com `LIMIT/OFFSET`
- Busca por nome e telefone via `ILIKE`
- Aniversariantes do mes filtrados por `EXTRACT(MONTH FROM birthday)` — pode se beneficiar de indice funcional se volume crescer
- Contagem paralela com `Promise.all`

## Security

- Dados de clientes sao prioridade de seguranca (conforme CLAUDE.md)
- Telefone e endereco sao dados sensiveis
- Isolamento por `userId` impede acesso cruzado

## Test matrix

### Domain (clients.domain.test.ts)

- validateClientData: nome vazio, nome > 200, telefone < 8 ou > 15 digitos, acumula erros
- isUpcomingBirthday: null, hoje, dentro de 7 dias, fora de 7 dias, mes diferente, ja passou
- formatPhoneForWhatsApp: null, vazio, com prefixo 55, sem prefixo 55, com formatacao

### UseCases (clients.usecases.test.ts)

- create: dados validos, ValidationError para dados invalidos
- getById: encontrado, NotFoundError
- list: paginacao
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError
- getBirthdaysThisMonth: com aniversariantes, lista vazia

## Examples

```
POST /api/v1/clients
{ "name": "Maria Silva", "phone": "11999887766", "tags": ["vip"] }
=> 201 { "id": "...", "name": "Maria Silva", ... }

GET /api/v1/clients?page=1&limit=20&search=maria
=> 200 { "items": [...], "total": 5, "page": 1, "totalPages": 1 }

GET /api/v1/clients/birthdays
=> 200 [{ "id": "...", "name": "Maria", "birthday": "1990-03-15", ... }]
```

## Change log / Decisions

- Criacao inicial da feature com CRUD completo + birthdays endpoint
