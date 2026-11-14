# ai.context.mobile.md — Discovery (descoberta de recursos)

## Purpose

Levar a pessoa até os recursos pagos no momento em que eles fazem sentido, sem bloquear o uso do dia a dia:

1. **Próximo passo** depois de uma ação concluída: um aviso no rodapé com um botão que abre a tela relacionada.
2. **Prévia das telas pagas**: no lugar do cartão de bloqueio, um exemplo com dados fictícios do que a tela mostra, com o botão para desbloquear.
3. **Lista do teste grátis** na tela inicial: o que o teste do Essencial libera, com atalhos.

Motivo (2026-11-14): em 60 dias, 50 pessoas abriram Vendas e 56 a Precificação, mas só 1 abriu Fornecedores, 4 os Relatórios e 5 as Receitas. Nenhuma das 25 contas que ganharam o Profissional de presente assinou depois.

## Non-goals

- Não decide acesso: os bloqueios continuam pelo plano devolvido pela API (`hasActiveFeature`) e pelos guards do backend. A prévia é ilustrativa e não chama endpoints pagos.
- Não mostra dados reais da pessoa na prévia nem números inventados como se fossem dela: todo exemplo é rotulado como exemplo.
- Não interrompe fluxos: o próximo passo não é modal e some sozinho.
- Não substitui o cartão de orientação de cada tela (`shared/guidance`).

## Boundaries & Ownership

- Depende de `@lucro-caseiro/contracts` (plano e nomes de analytics), `features/subscription` (perfil, limites, teste, paywall), `features/analytics` (rastreamento) e `@lucro-caseiro/ui` (componentes e `useFeature` da marca).
- Telas que usam: `app/pricing.tsx`, `app/products.tsx` (via `create-product-form`), `app/tabs/new-sale.tsx`, `features/finance/components/create-finance-entry.tsx`, `app/insights.tsx`, `app/recurring-expenses.tsx`, `app/purchases.tsx`, `app/tabs/index.tsx`.
- `NextStepHost` é montado uma vez em `app/_layout.tsx`, ao lado do `ToastHost`.

## Code pointers

| Arquivo                          | Descrição                                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `domain.ts`                      | Regras puras: qual próximo passo oferecer, itens da lista do teste, exemplos das prévias e leitura do progresso salvo |
| `domain.test.ts`                 | Testes das regras puras                                                                                               |
| `store.ts`                       | Progresso por conta (passos já mostrados, itens abertos, lista dispensada), salvo no aparelho                         |
| `use-next-step.ts`               | `useOfferNextStep()`: decide e mostra o próximo passo depois de uma ação                                              |
| `components/next-step-host.tsx`  | Aviso do próximo passo no rodapé                                                                                      |
| `components/paid-preview.tsx`    | Prévia de tela paga com dados de exemplo                                                                              |
| `components/trial-checklist.tsx` | Lista do teste grátis na tela inicial                                                                                 |

## Components

- `NextStepHost`: cartão no rodapé (acima da barra de abas), com título, texto, botão de ação e botão "Fechar". Some depois de 12 s. Tocar no botão abre a rota e registra `discovery_step_opened`.
- `PaidPreview({ screen, onUnlock })`: selo "Exemplo", título, linhas de exemplo, aviso "Exemplo com dados fictícios. No plano Profissional, aparecem os seus números." e o botão "Desbloquear no Profissional" (chama `onUnlock`, que abre o paywall da tela). Registra `paid_preview_viewed` uma vez por abertura.
- `TrialChecklist`: cartão "Aproveite seu teste grátis" com até 3 itens, cada um com estado feito/pendente e atalho. Botão "Dispensar" esconde para sempre nesta conta.

## Hooks

- `useOfferNextStep()` devolve `offer(trigger, count?)`. Lê o progresso da conta, aplica `nextStepFor` e, se houver passo, mostra o aviso, marca o passo como mostrado e registra `discovery_step_shown`.
- `useDiscoveryProgress()` carrega e expõe o progresso salvo da conta atual.

## API Integration

Nenhum endpoint novo. Usa `useLimits()` (contagens) e `useProfile()` (plano e teste) já existentes.

## Contracts

- Ações de analytics novas em `ANALYTICS_ACTION_NAMES`: `discovery_step_shown`, `discovery_step_opened` (prop `step`), `paid_preview_viewed`, `paid_preview_unlock` (prop `screen`), `trial_checklist_opened` (prop `item`).
- Valores das props são identificadores fechados (`recipes`, `catalog`, `insights`, `recurring_expenses`, `purchases`).

## Error Handling

- Falha ao ler ou gravar o progresso no aparelho: trata como progresso vazio e não bloqueia a tela (leitura limitada a 1,5 s, como a orientação).
- Sem conta logada, nada é mostrado.

## Performance

Regras puras e um único valor por conta no armazenamento local. Nenhuma requisição extra.

## Test matrix

- `nextStepFor`: precificação salva → receitas; 3º produto → catálogo; 3ª venda → relatórios; gasto lançado → gastos recorrentes; abaixo do mínimo não oferece; passo já mostrado não repete; receitas não aparecem quando a marca não tem ficha técnica.
- `trialChecklist`: itens feitos por receita cadastrada ou por item aberto; lista completa some.
- `parseDiscoveryProgress`: valores inválidos são descartados.
- `PAID_PREVIEWS`: cada tela tem título, linhas e só valores de exemplo.

## Examples

- Terceira venda registrada no Gratuito: aparece "Quanto você lucrou?" com o botão "Ver meu resultado", que abre Relatórios. Lá, no lugar do bloqueio, a prévia mostra faturamento, lucro estimado, produto campeão e melhor cliente de exemplo.
- Conta no teste grátis: a tela inicial mostra "Aproveite seu teste grátis" com catálogo, receita e relatórios.

## Change log / Decisions

- 2026-11-14: criação. Cada próximo passo aparece no máximo uma vez por conta. A lista do teste só aparece com o teste ativo e mostra o que o Essencial libera (catálogo e receitas ilimitadas) mais a prévia dos relatórios do Profissional. Prévias substituem o cartão de bloqueio no celular de Relatórios, Gastos recorrentes e Compras; as versões de desktop seguem com o cartão atual por enquanto.
