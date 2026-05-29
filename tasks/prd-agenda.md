# PRD: Agenda (Encomendas / Entregas) — Lucro Caseiro

> Status: **Planejado** (spec). Implementação pendente de aprovação.
> Origem: avaliações pedindo controle por **data** (confeiteira citando Natal/Páscoa) e
> a ideia de "agenda" do negócio. Decisão de produto: começar por uma **agenda unificada
> baseada em data** (encomendas/entregas), adaptável por tipo de negócio.

## Introdução

Hoje "venda" é algo **já realizado** (`soldAt`). Falta o lado do **futuro**: o que precisa
ser **produzido e entregue**, e **quando**. A Agenda resolve isso — uma lista de
**encomendas/compromissos com data**, status de produção e visões "Hoje / Amanhã / Semana",
com lembretes. Vira engajamento diário e ataca a dor real ("o que tenho pra entregar?").

## Goals

- Registrar **encomendas** com **data de entrega** (e hora opcional p/ serviços).
- Acompanhar **status** (a fazer → produzindo → pronto → entregue).
- Visões rápidas: **Atrasadas, Hoje, Amanhã, Esta semana, Próximas**.
- **Lembretes** (notificação local) de entregas de amanhã e atrasadas.
- Ao **entregar**, opcionalmente **registrar a venda** (integra com financeiro/vendas).
- **Adaptável** ao tipo de negócio (copy "Encomenda/Entrega" vs "Atendimento").

## Non-goals

- Não é calendário completo (sem visão mensal/grade horária estilo Google Agenda na v1).
- Não gerencia estoque/produção detalhada (só o status simples).
- Não substitui `sales` — encomenda é o **pipeline**; venda é o **realizado**.
- Sem recorrência de eventos na v1.

## Decisão de arquitetura

**Tabela separada `orders`** (não estender `sales`). Motivo: `sales` é receita realizada
(entra em financeiro e nos limites freemium); misturar pedidos futuros poluiria isso.
Quando uma encomenda é **entregue**, opcionalmente cria-se uma `sale` (link `saleId`),
aí sim entrando no financeiro. Mantém os boundaries limpos.

## Data Model

### Nova tabela: `orders`

| Coluna       | Tipo      | Constraints                                                             |
| ------------ | --------- | ----------------------------------------------------------------------- |
| id           | uuid      | PK                                                                      |
| userId       | uuid      | FK users, NOT NULL                                                      |
| clientId     | uuid      | FK clients, nullable (encomenda avulsa)                                 |
| title        | text      | NOT NULL (ex.: "Bolo de chocolate 2kg")                                 |
| deliveryDate | date      | NOT NULL                                                                |
| deliveryTime | text      | nullable (HH:MM — útil p/ atendimentos)                                 |
| status       | enum      | `pending`\|`in_production`\|`ready`\|`done`\|`cancelled` (def. pending) |
| amount       | decimal   | nullable (valor combinado)                                              |
| notes        | text      | nullable                                                                |
| saleId       | uuid      | nullable, FK sales (preenchido ao entregar+registrar venda)             |
| createdAt    | timestamp | default now()                                                           |

- Índices: `(userId, deliveryDate)`, `(userId, status)`. Tudo escopado por `userId`.
- Migration: criar tabela (via `db:push` ou SQL versionado, como `business_goals`).

## Invariants

- `title` obrigatório (trim > 0), `deliveryDate` válida (YYYY-MM-DD).
- `amount` >= 0 quando presente.
- Transições de status livres, exceto: `cancelled`/`done` são terminais (não voltam).
- "Atrasada" = `deliveryDate < hoje` e status não em (`done`, `cancelled`) — derivado, não armazenado.
- Toda query escopada por `userId`.

## Operations (API — nova feature `orders`)

```yaml
feature: orders
app: api
mobile_counterpart: orders
api:
  base: /api/v1/orders
  endpoints:
    - method: GET
      path: /
      query: status?, from?, to?   # range por data; sem filtro = próximas + atrasadas
      response: { items: Order[] }
    - method: POST
      path: /
      dto: CreateOrderDto
      response: Order (201)
    - method: GET
      path: /:id
      response: Order
    - method: PATCH
      path: /:id
      dto: UpdateOrderDto         # inclui mudança de status
      response: Order
    - method: POST
      path: /:id/deliver
      body: { registerSale: boolean, paymentMethod? }
      response: Order             # status=done; se registerSale, cria sale+finance e seta saleId
    - method: DELETE
      path: /:id
      response: 204
db:
  tables: [orders]
  indexes: [(userId, deliveryDate), (userId, status)]
invariants:
  - title.trim().length > 0
  - deliveryDate válida
  - done/cancelled terminais
```

### Boundaries

`orders.usecases` não importa arquivos internos de `sales`/`finance`. A conversão em venda
usa uma interface injetada (`ISaleCreator`) implementada por `SalesUseCases` no composition
root — mesmo padrão da meta de pró-labore.

## Contracts (Zod/DTO) — em `packages/contracts`

- **CreateOrderDto**: `{ title, deliveryDate, deliveryTime?, clientId?, amount?, notes?, status? }`
- **UpdateOrderDto**: `Partial<CreateOrderDto>` (+ status)
- **DeliverOrderDto**: `{ registerSale: boolean, paymentMethod?: PaymentMethod }`
- **Order**: `{ id, userId, clientId, clientName?, title, deliveryDate, deliveryTime, status, amount, notes, saleId, createdAt }`
- **OrderStatus**: `"pending"|"in_production"|"ready"|"done"|"cancelled"`

## Mobile — nova feature `orders`

Arquivos: `api.ts`, `hooks.ts`, `types.ts`, `domain.ts` (agrupar por data: atrasadas/hoje/
amanhã/semana/próximas; rótulos por status), `components/order-card.tsx`,
`components/order-form.tsx`, `use-delivery-notifier.ts`, `ai.context.mobile.md`.

### Telas / pontos de entrada

1. **Card na Home** — "Entregas de hoje" / "Amanhã" (nº + lista curta). Vetor de descoberta.
2. **Tela Agenda** (`/agenda`) — seções Atrasadas, Hoje, Amanhã, Esta semana, Próximas;
   FAB "Nova encomenda"; tap no item abre detalhe/edição com botões de status e "Entregar".
3. Entrada em **Mais** (e quick-access da Home).

### UX (princípios do CLAUDE.md)

- Linguagem simples; status com cores e ícone+texto.
- Copy adapta ao `businessType`: confeitaria/marmita → "Encomenda / Entregar"; serviços →
  "Atendimento / Concluir". (v1 pode usar "Encomenda/Entrega" universal e refinar depois.)
- Criar encomenda em ≤ 3 toques (Home/FAB → preencher → salvar).

### Notificações

`use-delivery-notifier.ts` (mesmo padrão do estoque baixo): notificação local quando há
**entregas amanhã** e/ou **atrasadas**. Dedupe por dia via AsyncStorage. Tipo novo
`DELIVERY` em `notification-types` roteando p/ `/agenda`.

## Freemium — DECISÃO EM ABERTO

| Opção               | Free                              | Premium                                |
| ------------------- | --------------------------------- | -------------------------------------- |
| **A (recomendada)** | Agenda completa grátis            | (futuro) visão mensal, exportar agenda |
| **B**               | Limite de N encomendas ativas/mês | Ilimitado                              |

Recomendação: **A** — agenda é utilidade core que gera uso diário e retenção; cobrar aqui
freia adoção. (Consistente com a decisão da meta de pró-labore.)

## Test matrix

### Domain

- `orders.domain` (API): validação (title/date/amount), transições de status (terminais).
- `orders/domain` (mobile): agrupamento por data (atrasada/hoje/amanhã/semana/próxima),
  rótulo/cor por status.

### UseCases (API)

- create válido / ValidationError; getById NotFound; list por range/status; update;
  deliver com `registerSale=false` (só status) e `true` (cria venda via `ISaleCreator` + seta saleId).

### Mobile

- `order-card` por status; `order-form` valida título/data; agrupamento na Agenda; notifier.

## Passos de implementação (ordem)

1. `packages/contracts`: DTOs + tipos.
2. `packages/database`: schema `orders` + migration.
3. API feature `orders`: domain (+testes) → repo.pg → usecases (ISaleCreator injetado) →
   routes → wire no composition root. **Criar `ai.context.api.md`**.
4. Mobile feature `orders`: api/hooks/types/domain + componentes + tela `/agenda` + card Home
   - entrada em Mais + `use-delivery-notifier` montado no root. **Criar `ai.context.mobile.md`**.
5. `pnpm context:lint` + `pnpm prepush`. Commits por camada (`feat(orders): ...`).
6. Migration `orders` no banco de produção (SQL no Supabase, como `business_goals`).

## Decisões em aberto (preciso confirmar antes de implementar)

1. **Status**: 4 estados (a fazer → produzindo → pronto → entregue) ou simplificar p/ 3
   (a fazer → pronto → entregue)?
2. **Conversão em venda** ao entregar: incluir já na v1 (recomendado) ou deixar p/ v2?
3. **Freemium**: grátis (recomendado) ou com limite?
4. **Itens de produto** na encomenda (vincular produtos como em `sales`) — v1 só `title`+`amount`
   (recomendado) ou já com itens?
