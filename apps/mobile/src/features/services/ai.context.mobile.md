# ai.context.mobile.md — Services

---

## Purpose

Gerenciar o ciclo completo de serviços: oferta, opções, adicionais, pacotes,
divulgação pública, solicitações de horário, atendimentos e resultado financeiro.

A tela é propositalmente neutra em relação à profissão: atende desde beleza e
manutenção até consultoria, aulas, criação e serviços presenciais ou online.

## Non-goals

- Não controla estoque.
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
- `components/service-dashboard-modal.tsx` — operação, indicadores, pacotes,
  solicitações e histórico por serviço.
- `app/services.tsx` — tela de gestão.

## Components

- `ServiceForm` — modal canônico de criação e edição. Valida nome, duração,
  duplicidade e campos financeiros antes de chamar as mutations.
- `app/services.tsx` — lista serviços ativos e inativos, abre o formulário e
  apresenta visão geral, filtros de disponibilidade/revisão e sinais de saúde do
  preço.
- `ServiceDashboardModal` — compartilha o serviço diretamente no WhatsApp com a
  mensagem e o link da vitrine preenchidos.

## Hooks

- `useServices()` — consulta `["services"]` quando existe token de autenticação.
- `useCreateService()` — cria um serviço e invalida `["services"]`.
- `useUpdateService()` — atualiza um serviço e invalida `["services"]`.
- `useServiceInsights()` — faturamento, lucro, ticket, clientes e histórico.
- `useServiceBookingRequests()` — solicitações vindas da vitrine.
- `useServicePackagePurchases()` / `usePurchaseServicePackage()` — saldo e venda
  de pacotes.

## Invariants

- Produtos e serviços coexistem.
- Duração fica entre 5 e 1440 minutos.
- Valores e percentuais nunca são negativos.
- Taxas ficam no máximo em 95%.
- O formulário não presume custos.
- Markup é apresentado como “acréscimo sobre o custo”, nunca como margem.
- Inativos continuam visíveis na gestão e deixam de aparecer na Agenda.
- Serviço disponível sem preço ou abaixo do custo informado entra no filtro de
  revisão.
- Resumos consideram somente serviços disponíveis; cadastros pausados não distorcem
  preço médio nem duração média.

## API Integration

| Endpoint                                         | Verbo | Uso                     |
| ------------------------------------------------ | ----- | ----------------------- |
| `/api/v1/orders/services`                        | GET   | listar                  |
| `/api/v1/orders/services`                        | POST  | criar                   |
| `/api/v1/orders/services/:id`                    | PATCH | editar                  |
| `/api/v1/orders/services/:id/insights`           | GET   | indicadores e histórico |
| `/api/v1/orders/services/:id/booking-requests`   | GET   | pedidos públicos        |
| `/api/v1/orders/services/booking-requests/:id`   | PATCH | status do pedido        |
| `/api/v1/orders/services/package-purchases`      | GET   | saldos de pacotes       |
| `/api/v1/orders/services/packages/:id/purchases` | POST  | vender pacote           |

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
- classificação de preço ausente ou abaixo do custo;
- visão geral somente com serviços disponíveis;
- filtros por disponibilidade e revisão de preço.

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
- 2026-07-28: a gestão passa a representar prestadores em geral, com visão
  operacional, filtros de revisão, cards financeiros e exemplos neutros.
- 2026-07-28: expansão v2 adiciona local e intervalo de agenda, divulgação
  pública, variações, adicionais, pacotes recorrentes, painel de desempenho,
  histórico e triagem de solicitações.
- 2026-07-31: “Compartilhar no WhatsApp” no painel do serviço abre diretamente o
  seletor de conversas, sem depender do menu de compartilhamento do Windows.
- 2026-08-18: filtros da lista usam o `Chip` compartilhado com badge de
  contagem local (`filterServices` sem busca).
- 2026-08-25: a navbar do app no celular vem do root (`MobileFloatingTabBar`);
  a tela de serviços não duplica mais uma barra própria.
- 2026-08-24: estado vazio da lista deixou de usar ilustração PNG.
- 2026-08-31: lista com itens ganhou `ScreenCreateBar` (`+ Cadastrar serviço`) no rodapé,
  além do FAB `+`. O CTA interno da lista saiu.
