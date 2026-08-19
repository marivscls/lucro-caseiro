# ai.context.api.md — Suppliers

## Purpose

Gerencia fornecedores reutilizáveis por usuário e entrega a visão agregada da tela. Compras e itens
continuam em `purchases`; resumo mensal, última compra e pedido aberto são derivados.

## Non-goals

- Não mantém orçamento de compras; por isso `planningStatus` permanece `none`.
- Não duplica valores ou itens de compra na tabela `suppliers`.
- Não envia mensagens nem registra uma recompra automaticamente.

## Boundaries & Ownership

- Depende de contracts, schema Drizzle, `purchases` e `purchase_items`.
- Subscription aplica o limite freemium no cadastro.
- Materials, Packaging e Purchases mantêm FKs opcionais para fornecedor.

## Code pointers

- `suppliers.routes.ts`: CRUD e overview.
- `suppliers.usecases.ts`: validação e duplicidade.
- `suppliers.domain.ts`: regras puras e cálculo mensal.
- `suppliers.repo.pg.ts`: persistência e agregação.
- `packages/contracts/src/schemas/supplier.ts`: DTOs.
- `packages/database/src/migrations/061_supplier_management.sql`: migração.

## Data Model

`suppliers` persiste nome, categoria, contatos, descrição de compra, preferência, avatar, flags
explícitas de acompanhamento/reposição e `isActive`. Compras continuam em suas entidades próprias.
A migração 061 adiciona defaults compatíveis aos registros antigos, que usam iniciais como avatar.

## Invariants

- Cada query é isolada por `userId`.
- Nome e categoria são obrigatórios; email e telefone são validados quando preenchidos.
- `hasWhatsApp` exige telefone.
- Preset exige `avatarPresetId`; upload exige `avatarUrl`.
- Duplicidade e limite contam apenas fornecedores ativos.
- A lista omite arquivados, mas o mês inclui compras ainda vinculadas a eles.
- `hasOpenOrder` exige `paymentStatus = pending`.

## Operations

| Verbo  | Caminho                      | Resultado                          |
| ------ | ---------------------------- | ---------------------------------- |
| GET    | `/api/v1/suppliers/overview` | painel mensal e cards enriquecidos |
| GET    | `/api/v1/suppliers`          | lista paginada ativa               |
| GET    | `/api/v1/suppliers/:id`      | detalhe                            |
| POST   | `/api/v1/suppliers`          | cadastro                           |
| PATCH  | `/api/v1/suppliers/:id`      | edição, status e arquivo           |
| DELETE | `/api/v1/suppliers/:id`      | exclusão física confirmada         |

## Authorization & RLS

As rotas usam `authMiddleware`; o id vem do JWT e é aplicado em cada consulta do repositório.

## Contracts (Zod/DTO)

`CreateSupplierDto`, `UpdateSupplierDto`, `SupplierDto` e `SuppliersOverviewDto` são os contratos
públicos. Categorias: `supplies`, `packaging`, `food`, `other`; avatares: `preset`, `upload`,
`initials`.

## Errors

- 400 para payload inválido ou WhatsApp sem telefone.
- 403 `LIMIT_EXCEEDED` no limite freemium.
- 404 quando o id não pertence ao usuário.
- 409 para fornecedor ativo duplicado.

## Events / Side effects

Mutations escrevem somente no banco. Upload ocorre no cliente antes do POST/PATCH e a recompra abre
o fluxo de purchases para confirmação.

## Performance

Listagem usa paginação. Overview busca fornecedores ativos, compras vinculadas e somente os itens das
últimas compras necessárias. Valores monetários são somados em centavos.

## Security

Contato e endereço são dados privados, sempre isolados por `userId`. Exclusão mantém integridade das
compras via `ON DELETE SET NULL`; arquivamento é preferido quando existe histórico.

## Test matrix

`suppliers.domain.test.ts` cobre validação e cálculo mensal; `suppliers.usecases.test.ts` cobre CRUD,
duplicidade e falhas; `security-migrations.test.ts` garante a enumeração da migration 061.

## Examples

`GET /api/v1/suppliers/overview` retorna `{ month, items }`; cada item pode trazer a última compra com
seus itens, totais históricos e flags contextuais.

## Change log / Decisions

- 2026-08-18: categoria, avatares, flags, arquivo e overview real foram adicionados.
- O domínio ainda não possui orçamento de compras; a interface exibe estado neutro.
