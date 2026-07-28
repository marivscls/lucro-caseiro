# ai.context.mobile.md — Services

---

## Purpose

Gerenciar serviços como cadastro separado de produtos, guardar duração e preço
padrão, conferir opcionalmente a formação do preço e reutilizar serviços ativos na
Agenda.

## Non-goals

- Não controla estoque.
- Não registra serviço como item da venda.
- Não publica serviços no catálogo.
- Não detalha materiais individualmente.

## Boundaries & Ownership

- Depende de `@lucro-caseiro/contracts`, `@lucro-caseiro/ui`,
  `shared/hooks/use-auth` e `shared/utils/api-client`.
- A Agenda consome somente os hooks públicos de `features/services/hooks`.
- A API ainda é exposta em `/api/v1/orders/services` porque o cadastro nasceu junto
  da integração da Agenda; o domínio mobile permanece separado.

## Code pointers

- `api.ts` — listagem, criação e atualização.
- `hooks.ts` — React Query com chave `["services"]`.
- `domain.ts` — cálculo puro de mão de obra, custo total e preço sugerido.
- `components/service-form.tsx` — formulário canônico de criação e edição.
- `app/services.tsx` — tela de gestão.

## Components

- `ServiceForm` — modal canônico de criação e edição. Valida nome, duração,
  duplicidade e campos financeiros antes de chamar as mutations.
- `app/services.tsx` — lista serviços ativos e inativos, abre o formulário e
  apresenta as ações de gestão.

## Hooks

- `useServices()` — consulta `["services"]` quando existe token de autenticação.
- `useCreateService()` — cria um serviço e invalida `["services"]`.
- `useUpdateService()` — atualiza um serviço e invalida `["services"]`.

## Invariants

- Produtos e serviços coexistem.
- Duração fica entre 5 e 1440 minutos.
- Valores e percentuais nunca são negativos.
- Taxas ficam no máximo em 95%.
- O formulário não presume custos.
- Markup é apresentado como “acréscimo sobre o custo”, nunca como margem.
- Inativos continuam visíveis na gestão e deixam de aparecer na Agenda.

## API Integration

| Endpoint                      | Verbo | Uso    |
| ----------------------------- | ----- | ------ |
| `/api/v1/orders/services`     | GET   | listar |
| `/api/v1/orders/services`     | POST  | criar  |
| `/api/v1/orders/services/:id` | PATCH | editar |

## Contracts

- `Service`, `CreateService` e `UpdateService` vêm de
  `@lucro-caseiro/contracts`.
- `description` e `defaultPrice` podem ser `null`.
- `durationMinutes` é inteiro entre 5 e 1440.
- Custos, percentuais e preço usam números em reais; a máscara monetária existe
  somente na camada de apresentação.

## Error Handling

- Validações de campo e nome duplicado usam `alertValidation`.
- Falhas de rede ou da API são normalizadas por `alertError`.
- Mutations só fecham o modal depois de uma resposta bem-sucedida.

## Performance

- A lista usa cache compartilhado do React Query na chave `["services"]`.
- O cálculo de preço é puro e memoizado no formulário.
- A verificação de duplicidade refaz a consulta antes de salvar para reduzir
  conflitos com dados desatualizados.

## Test matrix

- cálculo de mão de obra por duração;
- soma de custos;
- acréscimo sobre custo;
- gross-up de taxas;
- ausência de premissas quando os campos estão zerados.

## Examples

```ts
const pricing = calculateServicePricing({
  durationMinutes: 60,
  materialCost: 20,
  hourlyRate: 30,
  otherCost: 0,
  fixedCostShare: 10,
  markupPercent: 50,
  feesPercent: 5,
});
```

## Change log / Decisions

- 2026-07-28: serviços passam a coexistir com produtos e ganham rota de gestão,
  formação opcional de preço e integração com a Agenda.
