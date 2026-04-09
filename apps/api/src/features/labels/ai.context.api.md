# ai.context.api.md — Labels

---

## Purpose

Gerenciar rotulos personalizados para produtos do negocio caseiro. Permite criar rotulos baseados em templates pre-definidos, vincular a produtos e incluir informacoes como ingredientes, logo e QR code.

## Non-goals

- Nao gera o arquivo visual/imagem do rotulo (apenas armazena dados estruturados)
- Nao faz impressao de rotulos
- Nao gerencia estoque de etiquetas fisicas

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CreateLabelDto, UpdateLabelDto, PaginationDto, Label, LabelData), `@lucro-caseiro/database/schema` (labels)
- **Dependentes**: nenhum
- **Cross-feature**: pode referenciar `productId` de Products

## Code pointers

- `apps/api/src/features/labels/labels.routes.ts` — rotas Express
- `apps/api/src/features/labels/labels.usecases.ts` — logica de negocio
- `apps/api/src/features/labels/labels.domain.ts` — validacoes, templates e funcoes puras
- `apps/api/src/features/labels/labels.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/labels/labels.types.ts` — interfaces e tipos
- `apps/api/src/features/labels/labels.domain.test.ts` — testes de dominio
- `apps/api/src/features/labels/labels.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `labels`

| Coluna     | Tipo      | Constraints           |
| ---------- | --------- | --------------------- |
| id         | uuid      | PK                    |
| userId     | uuid      | FK users, NOT NULL    |
| productId  | uuid      | nullable, FK products |
| templateId | varchar   | NOT NULL              |
| name       | varchar   | NOT NULL              |
| data       | jsonb     | NOT NULL (LabelData)  |
| logoUrl    | varchar   | nullable              |
| qrCodeUrl  | varchar   | nullable              |
| createdAt  | timestamp | default now()         |

## Invariants

- Nome do rotulo e obrigatorio (trim > 0 caracteres)
- Nome do rotulo deve ter no maximo 200 caracteres
- Template e obrigatorio e deve ser um dos templates validos
- Templates validos: "classico", "moderno", "minimalista", "artesanal", "gourmet"
- Toda query escopada por `userId`

## Operations

```yaml
feature: labels
app: api
mobile_counterpart: labels
api:
  base: /api/v1/labels
  endpoints:
    - method: POST
      path: /
      dto: CreateLabelDto
      response: Label (201)
    - method: GET
      path: /
      query: page, limit, productId
      dto: PaginationDto
      response: { items: Label[], total, page, totalPages }
    - method: GET
      path: /templates
      response: LabelTemplate[]
    - method: GET
      path: /:id
      response: Label
    - method: PATCH
      path: /:id
      dto: UpdateLabelDto
      response: Label
    - method: DELETE
      path: /:id
      response: 204
db:
  tables:
    - labels
  indexes:
    - (userId, id)
    - (userId, productId)
    - (userId, createdAt DESC)
invariants:
  - name.trim().length > 0
  - name.length <= 200
  - templateId in ["classico", "moderno", "minimalista", "artesanal", "gourmet"]
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware` (exceto GET /templates que nao requer userId)
- `userId` extraido do token JWT
- Toda query filtra por `userId`

## Contracts (Zod/DTO)

- **CreateLabelDto**: `{ productId?, templateId, name, data: LabelData, logoUrl?, qrCodeUrl? }`
- **UpdateLabelDto**: `Partial<CreateLabelDto>`
- **LabelData**: `{ productName, ingredients?, ... }` (objeto JSON flexivel)
- **Label**: `{ id, userId, productId, templateId, name, data, logoUrl, qrCodeUrl, createdAt }`
- **LabelTemplate**: `{ id: string, name: string }`

## Errors

| Status | Quando                        | Mensagem                   |
| ------ | ----------------------------- | -------------------------- |
| 400    | Nome vazio, template invalido | Array de strings com erros |
| 404    | Rotulo nao encontrado         | "Rotulo nao encontrado"    |

## Events / Side effects

- Nenhum

## Performance

- Listagem com filtro opcional por `productId` + paginacao
- Templates servidos de constante em memoria (sem query DB)

## Security

- Isolamento por `userId`
- `data` e JSONB — deve-se ter cuidado com tamanho do payload

## Test matrix

### Domain (labels.domain.test.ts)

- validateLabelData: nome vazio, nome > 200, templateId vazio, templateId invalido, acumulo
- getAvailableTemplates: retorna 5 templates, inclui cada um, retorna copia
- isValidTemplate: validos, invalido, vazio
- buildLabelContent: sem receita, merge ingredientes, preserva ingredientes existentes, nova referencia

### UseCases (labels.usecases.test.ts)

- create: dados validos, ValidationError
- getById: encontrado, NotFoundError
- list: paginacao, filtro productId
- update: dados validos, NotFoundError, ValidationError
- remove: existente, NotFoundError
- getTemplates: retorna templates

## Examples

```
POST /api/v1/labels
{ "name": "Rotulo Brigadeiro", "templateId": "classico", "data": { "productName": "Brigadeiro" } }
=> 201 { "id": "...", "templateId": "classico", ... }

GET /api/v1/labels/templates
=> 200 [{ "id": "classico", "name": "Classico" }, ...]
```

## Change log / Decisions

- Criacao inicial com CRUD + templates pre-definidos
- Templates hardcoded no dominio (nao persistidos em DB)
- `buildLabelContent` permite merge de ingredientes de receita
