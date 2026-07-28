# ai.context.api.md — Production

## Purpose

Fechar uma produção com quantidade planejada/real, consumo de insumos e perdas. O fechamento
calcula custo previsto, realizado e desperdício e atualiza estoques de insumos e produto.

## Non-goals

- Planejamento industrial, lotes, chão de fábrica ou rastreabilidade fiscal.
- Conversão arbitrária de unidades ou previsão automática sem ficha técnica.

## Boundaries & Ownership

- Produção possui o fechamento e seus snapshots financeiros.
- Materiais possui saldo e custo unitário; Produtos possui o saldo produzido.
- Receitas podem orientar o planejado na interface, mas não são reescritas pelo fechamento.

## Code pointers

- `production.routes.ts` — listagem e fechamento autenticados.
- `production.usecases.ts` — validação, transação e montagem do resultado.
- `production.domain.ts` — cálculo determinístico dos custos.
- `production.repo.pg.ts` — persistência e ajustes de estoque.
- `production.types.ts` — fronteira do repositório.

## Data Model

- `production_runs`: produto/receita, quantidades planejada e produzida, custos, status e datas.
- `production_run_items`: material, quantidades planejada/real/perda, custo unitário em snapshot.
- `stock_movements`: recebe a entrada do produto com origem na produção.

## Invariants

- Produto ou receita é obrigatório e deve pertencer à pessoa autenticada.
- Existe pelo menos um insumo; quantidades e custos não são negativos.
- Custo previsto = soma de planejado × custo; realizado = soma de realizado × custo.
- Desperdício é armazenado separadamente e nunca inferido de uma diferença sem apontamento.
- O fechamento é atômico: sem saldo suficiente, nada é persistido.

## Operations

```yaml
feature: production
app: api
mobile_counterpart: production
api:
  base: /api/v1/production
  endpoints:
    - method: GET
      path: /
      query: limit?
      response: { items: ProductionRun[] }
    - method: POST
      path: /close
      body: CreateProductionRun
      response: ProductionRun (201)
db:
  tables: [production_runs, production_run_items, materials, products, stock_movements]
invariants:
  - custo calculado no servidor
  - estoque e fechamento na mesma transacao
```

## Authorization & RLS

- As rotas usam `authMiddleware` e `getUserId(req)`.
- Todas as leituras, referências e alterações são escopadas por `userId`.

## Contracts (Zod/DTO)

- `CreateProductionRunDto`: produto/receita, quantidades, observação e 1..200 materiais.
- `ProductionRunMaterialInputDto`: material, planejado, realizado, perda e custo unitário.
- `ProductionRunDto`: inclui custos calculados, materiais em snapshot e data de fechamento.

## Errors

- 400 para entrada inválida, ausência de produto/receita ou saldo insuficiente.
- 404 quando produto, receita ou material não pertence à pessoa autenticada.
- Falha transacional não deixa fechamento ou estoque parcial.

## Events / Side effects

- Reduz materiais pelo consumo real informado.
- Adiciona a quantidade produzida ao estoque do produto e registra movimento `production`.
- Não lança receita ou despesa financeira automaticamente.

## Performance

- Listagem limitada e ordenada por criação decrescente.
- Materiais do fechamento são gravados em lote dentro da transação.

## Security

- Totais recebidos do cliente não são aceitos; custos são recalculados no servidor.
- IDs são validados como UUID e conferidos dentro do `userId`.
- Limites de quantidade e dinheiro vêm dos contratos compartilhados.

## Test matrix

- Domínio: custo planejado, realizado e desperdício.
- Use case/repositório: saldo suficiente, rollback por saldo insuficiente e entrada do produto.
- Contrato: limites, pelo menos um material e produto/receita.
- Interface: vazio, dados, erro, mobile, tablet e desktop.

## Examples

`POST /api/v1/production/close` com 10 unidades planejadas, 9 produzidas e os materiais realmente
usados retorna custos previstos/realizados e a perda explicitamente apontada.

## Change log / Decisions

- 2026-07-24: criado o fechamento mínimo. Desperdício só existe quando informado; não é deduzido
  silenciosamente. Estoque é alterado apenas ao confirmar o fechamento.
