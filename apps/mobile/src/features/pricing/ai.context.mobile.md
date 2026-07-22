# ai.context.mobile.md — Pricing (Mobile Feature)

---

## Purpose

A precificacao tem dois caminhos conectados. A rota `/pricing` abre o modo **Simples** em qualquer plano: insumos, embalagem e lucro ficam evidentes; mao de obra e rateio ficam em "Incluir outros custos", fechado e opcional. A rota `/pricing-complete` e um recurso Profissional (`advancedPricing`), preserva o wizard de 5 passos, exige premissas completas para mao de obra/rateio e apresenta o resultado como estimativa. Nenhum modo presume producao mensal nem inclui gastos fixos silenciosamente. Ambos salvam no mesmo historico.

## Non-goals

- Nao cadastra produtos (feature `products`).
- Nao gerencia receitas/ingredientes (feature `recipes`).
- Nao registra vendas (feature `sales`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `CreatePricing`, `Pricing` e cálculos puros compartilhados), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** nenhum direto (resultados salvos podem ser consultados por historico).

## Code pointers

| Arquivo                                                                     | Descricao                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/mobile/src/features/pricing/api.ts`                                   | Funcoes HTTP (calculatePricing, fetchPricingHistory, fetchPricing) |
| `apps/mobile/src/features/pricing/hooks.ts`                                 | React Query hooks                                                  |
| `apps/mobile/src/features/pricing/components/pricing-calculator.tsx`        | Wizard de 5 passos + resultado                                     |
| `apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx` | Calculo rapido com custos objetivos e extras opcionais             |
| `apps/mobile/src/features/pricing/components/pricing-result.tsx`            | Tela de resultado com breakdown visual                             |
| `apps/mobile/src/features/pricing/components/pricing-mode-switch.tsx`       | Alterna entre Simples e Completa sem empilhar as rotas             |
| `apps/mobile/src/features/pricing/components/pricing-history-modal.tsx`     | Historico compartilhado pelas duas telas                           |
| `apps/mobile/src/app/pricing.tsx`                                           | Modo Simples (rota `/pricing`)                                     |
| `apps/mobile/src/app/pricing-complete.tsx`                                  | Modo Completo (rota `/pricing-complete`)                           |

As funções de cálculo vivem em `packages/contracts/src/pricing-calculator.ts`; o arquivo local
`features/pricing/calc.ts` apenas reexporta a fonte compartilhada usada também pela API e pelo site.

## Components

### `PricingCalculator`

- **Props:** `{ onSave?: () => void }`
- Wizard com 5 steps + resultado:
  1. Custo dos insumos (R$) — com seletor opcional de **produto** que pré-preenche o valor
     com o `costPrice` real (derivado da receita) e amarra o `productId` no salvamento.
     Só lista produtos com `costPrice != null`.
  2. Custo da embalagem (R$), com escolha exata de embalagem cadastrada
  3. Mao de obra (tempo do lote + rendimento + valor/hora, calculo por unidade)
  4. Custos fixos rateados por unidade (R$)
  5. Acrescimo sobre o custo (% presets ou custom) + **taxas de venda opcionais** (iFood % e
     cartão %), somadas em `feesPercent`.
- Barra de progresso visual.
- Calculo local: `totalCost = ingredientes + embalagem + maoDeObra + fixos`;
  `precoBase = totalCost * (1 + acrescimo/100)`; com taxas, **gross-up**:
  `precoFinal = precoBase / (1 - feesPercent/100)` (a taxa incide sobre a venda, preservando
  o lucro desejado).
- Botoes Voltar/Proximo em cada step.

### `PricingResult`

- **Props:** `{ ingredientCost, packagingCost, laborCost, fixedCostShare, totalCost, marginPercent, suggestedPrice, profitPerUnit, feesPercent?, feesAmount?, finalPrice?, onRecalculate, onSave, isSaving }`
- Card hero com o **preço final** (com taxas, se houver) ou o preço sugerido; quando há
  taxas, mostra a quebra "base + X% taxas".
- Barra empilhada de composicao de custos (ingredientes, embalagem, mao de obra, custos fixos) com legenda colorida.
- Card de lucro por unidade e margem real sobre o preco.
- Projecao mensal somente quando a pessoa informa a producao mensal.
- Botoes "Salvar calculo" e "Recalcular".

## Hooks

| Hook                           | Tipo          | Descricao                                                                                                                        |
| ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `useCalculatePricing()`        | `useMutation` | Salva calculo no backend.                                                                                                        |
| `usePricingList(opts?)`        | `useQuery`    | Lista completa dos calculos do usuario (filtro opcional `productId`). Usado no Historico. Query key: `["pricing", "list", opts]` |
| `usePricingHistory(productId)` | `useQuery`    | Historico por produto (endpoint dedicado). Query key: `["pricing", "history", productId]`                                        |
| `usePricing(id)`               | `useQuery`    | Detalhe de um calculo. Query key: `["pricing", id]`                                                                              |

## API Integration

| Endpoint                                     | Verbo | Funcao                | Parametros                             |
| -------------------------------------------- | ----- | --------------------- | -------------------------------------- |
| `/api/v1/pricing/calculate`                  | POST  | `calculatePricing`    | body: `CreatePricing`                  |
| `/api/v1/pricing`                            | GET   | `fetchPricingList`    | `?page&limit&productId?` (lista geral) |
| `/api/v1/pricing/product/:productId/history` | GET   | `fetchPricingHistory` | path param `productId`                 |
| `/api/v1/pricing/:id`                        | GET   | `fetchPricing`        | path param `id`                        |

## Contracts

- `CreatePricing` — payload (ingredientCost, packagingCost, laborCost, fixedCostShare, marginPercent, `feesPercent?` 0–95).
- `Pricing` — resultado salvo (inclui `feesPercent`, `feesAmount`, `finalPrice`).

## Error Handling

- **Erro de salvamento:** tratado pelo estado da mutation (isPending/isError).
- **Validacao local:** insumos sao obrigatorios; mao de obra e rateio podem ficar zerados, mas, quando iniciados, exigem todas as premissas necessarias.
- **Sucesso ao salvar:** `Alert.alert("Calculo salvo!")` + `router.back()`.

## Performance

- Calculo inteiramente local (nenhuma chamada API ate salvar).
- Wizard com renderizacao condicional por step (apenas 1 step visivel por vez).

## Test matrix

- [ ] Calculo de custo total soma cada um dos componentes
- [ ] Calculo de mao de obra por unidade: ((minutos/60) \* valorHora) / rendimento
- [ ] Preco sugerido: totalCost \* (1 + acrescimo/100)
- [ ] Preco final com taxas (gross-up): precoBase / (1 - feesPercent/100)
- [ ] Projecao mensal so aparece com producao confirmada
- [ ] Navegacao entre steps funciona corretamente
- [ ] `useCalculatePricing` envia payload correto

## Examples

- Acessado via Home (quick access "Precificacao") ou rota `/pricing`.
- Fluxo: step 1 -> 2 -> 3 -> 4 -> 5 -> resultado -> salvar ou recalcular.

## Change log / Decisions

- 2026-07-16: fórmulas puras movidas para `@lucro-caseiro/contracts` para manter aplicativo,
  backend e calculadora pública do site matematicamente idênticos.
- ~~Projecao mensal fixa em 200 unidades~~ → agora vem da **Produção mensal estimada** (step 4); o resultado usa esse número na projeção (`monthlyUnits`).
- Calculo feito no front para feedback instantaneo; POST de save envia ao backend para persistencia.
- Custo real: o step 1 pode puxar o `costPrice` de um produto (que vem da receita/insumos), em
  vez de digitar o custo na mao. O `productId` selecionado vai junto no POST de calculo.
- **Taxas de venda (iFood/cartão) em %** (step 5, opcional): aplicadas via **gross-up** sobre
  o preço de venda para preservar a margem. Inspirado em reviews do concorrente
  (`tasks/prd-melhorias-concorrente.md`).
- 2026-06-15: **redesign do wizard** (`pricing-calculator.tsx`): círculos numerados com check + "Etapa X de 5", título fora do card, cards ricos com ícone, **stepper** no tempo de mão de obra (step 3) e na produção mensal (step 4), cards de valor calculado (mão de obra/unidade, custo fixo/unidade) e caixas de dica (verde/azul). **Step 4 mudou**: agora pede **custos fixos mensais** + **produção mensal** e calcula `fixedCostShare = mensal ÷ produção` (antes era valor/unidade direto). Step 5 ganhou "Margem selecionada" + **Resumo do cálculo** (custo total, margem, preço base, taxas, preço final). Step 1 mostra card "Produto selecionado" + "Valor importado da receita"; step 2 mostra **sugestão = média do custo das embalagens cadastradas** (`usePackagingList`). Campos de dinheiro têm **mini-calculadora** (`shared/components/calculator-modal.tsx`). Top bar (em `pricing.tsx`): voltar + "Precificação" + Histórico. `PricingResult`: badges de % por item na composição, "margem sobre o preço" e projeção usando `monthlyUnits`.
- 2026-06-15: **Histórico passou a listar o histórico completo** (corrige histórico vazio). Antes exigia selecionar um produto e usava só `usePricingHistory(productId)` — cálculos salvos **sem produto** (custo digitado na mão) nunca apareciam. Agora o modal usa `usePricingList()` (GET `/api/v1/pricing`), lista geral com **filtro por produto** (chip "tudo" + um por produto + "Cálculo avulso") e cada card mostra o nome do produto (ou "Cálculo avulso"), data, preço final, custo e margem.
- 2026-06-15: **resultado** (`pricing-result.tsx`): valores grandes em 1 linha (`adjustsFontSizeToFit`) e ícones em círculo nos títulos (Composição/Margem/Projeção). Mini-calculadora (`calculator-modal.tsx`): operadores em rosa sólido (visíveis) + prévia da operação pendente ("3 ×") + operador ativo destacado.
- 2026-07-18: o resultado oferece “Salvar e criar produto”; o cálculo é persistido e a rota de
  Produtos abre o formulário com o preço preenchido. A criação concluída registra
  `product_created_from_pricing`, marco explícito do funil de ativação.
- 2026-07-22: a entrada `/pricing` virou o modo **Simples**, com resultado ao vivo e importação do custo cadastrado do produto. O wizard antigo
  ficou em `/pricing-complete`; um seletor segmentado alterna entre os modos. Na interface completa,
  `marginPercent` passou a ser nomeado corretamente como **acréscimo sobre o custo**; a margem real
  continua sendo calculada e exibida no resultado.
- 2026-07-22: a Simples passou a deixar mão de obra e gastos fixos em uma seção opcional fechada;
  removeu a importação silenciosa de gastos e a produção presumida de 100 unidades. A Completa passou
  a calcular mão de obra pelo lote/rendimento, selecionar embalagens pelo custo exato e validar premissas
  incompletas. Os resultados agora se identificam como estimativas baseadas nos dados informados.
- 2026-07-22: a tela Completa passou a exigir a feature `advancedPricing`, exclusiva do plano
  Profissional. Contas sem a feature veem a apresentação e o CTA antes de qualquer formulário;
  a Simples continua disponível com toda a matemática básica necessária.
