# ai.context.mobile.md — Pricing (Mobile Feature)

---

## Purpose

Calculadora de precificacao guiada (wizard de 5 passos) que ajuda o usuario a definir o preco de venda de um produto. Considera custo de ingredientes, embalagem, mao de obra, custos fixos rateados e margem de lucro desejada. Exibe resultado com composicao de custos, lucro por unidade e projecao mensal.

## Non-goals

- Nao cadastra produtos (feature `products`).
- Nao gerencia receitas/ingredientes (feature `recipes`).
- Nao registra vendas (feature `sales`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `CreatePricing`, `Pricing`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** nenhum direto (resultados salvos podem ser consultados por historico).

## Code pointers

| Arquivo                                                              | Descricao                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/mobile/src/features/pricing/api.ts`                            | Funcoes HTTP (calculatePricing, fetchPricingHistory, fetchPricing) |
| `apps/mobile/src/features/pricing/hooks.ts`                          | React Query hooks                                                  |
| `apps/mobile/src/features/pricing/components/pricing-calculator.tsx` | Wizard de 5 passos + resultado                                     |
| `apps/mobile/src/features/pricing/components/pricing-result.tsx`     | Tela de resultado com breakdown visual                             |
| `apps/mobile/src/app/pricing.tsx`                                    | Screen (rota `/pricing`)                                           |

## Components

### `PricingCalculator`

- **Props:** `{ onSave?: () => void }`
- Wizard com 5 steps + resultado:
  1. Custo dos insumos (R$) — com seletor opcional de **produto** que pré-preenche o valor
     com o `costPrice` real (derivado da receita) e amarra o `productId` no salvamento.
     Só lista produtos com `costPrice != null`.
  2. Custo da embalagem (R$)
  3. Mao de obra (minutos + valor/hora, calculo automatico)
  4. Custos fixos rateados por unidade (R$)
  5. Margem de lucro (% presets ou custom) + **taxas de venda opcionais** (iFood % e
     cartão %), somadas em `feesPercent`.
- Barra de progresso visual.
- Calculo local: `totalCost = ingredientes + embalagem + maoDeObra + fixos`;
  `precoBase = totalCost * (1 + margem/100)`; com taxas, **gross-up**:
  `precoFinal = precoBase / (1 - feesPercent/100)` (a taxa incide sobre a venda, preservando
  a margem).
- Botoes Voltar/Proximo em cada step.

### `PricingResult`

- **Props:** `{ ingredientCost, packagingCost, laborCost, fixedCostShare, totalCost, marginPercent, suggestedPrice, profitPerUnit, feesPercent?, feesAmount?, finalPrice?, onRecalculate, onSave, isSaving }`
- Card hero com o **preço final** (com taxas, se houver) ou o preço sugerido; quando há
  taxas, mostra a quebra "base + X% taxas".
- Barra empilhada de composicao de custos (ingredientes, embalagem, mao de obra, custos fixos) com legenda colorida.
- Card de margem de lucro por unidade.
- Projecao mensal (200 unidades fixo).
- Botoes "Salvar calculo" e "Recalcular".

## Hooks

| Hook                           | Tipo          | Descricao                                                                         |
| ------------------------------ | ------------- | --------------------------------------------------------------------------------- |
| `useCalculatePricing()`        | `useMutation` | Salva calculo no backend.                                                         |
| `usePricingHistory(productId)` | `useQuery`    | Historico de calculos por produto. Query key: `["pricing", "history", productId]` |
| `usePricing(id)`               | `useQuery`    | Detalhe de um calculo. Query key: `["pricing", id]`                               |

## API Integration

| Endpoint                                     | Verbo | Funcao                | Parametros             |
| -------------------------------------------- | ----- | --------------------- | ---------------------- |
| `/api/v1/pricing/calculate`                  | POST  | `calculatePricing`    | body: `CreatePricing`  |
| `/api/v1/pricing/product/:productId/history` | GET   | `fetchPricingHistory` | path param `productId` |
| `/api/v1/pricing/:id`                        | GET   | `fetchPricing`        | path param `id`        |

## Contracts

- `CreatePricing` — payload (ingredientCost, packagingCost, laborCost, fixedCostShare, marginPercent, `feesPercent?` 0–95).
- `Pricing` — resultado salvo (inclui `feesPercent`, `feesAmount`, `finalPrice`).

## Error Handling

- **Erro de salvamento:** tratado pelo estado da mutation (isPending/isError).
- **Validacao local:** cada um dos valores sao calculados localmente antes de enviar; nao ha validacao de campos obrigatorios por step (valores default 0).
- **Sucesso ao salvar:** `Alert.alert("Calculo salvo!")` + `router.back()`.

## Performance

- Calculo inteiramente local (nenhuma chamada API ate salvar).
- Wizard com renderizacao condicional por step (apenas 1 step visivel por vez).

## Test matrix

- [ ] Calculo de custo total soma cada um dos componentes
- [ ] Calculo de mao de obra: (minutos/60) \* valorHora
- [ ] Preco sugerido: totalCost \* (1 + margem/100)
- [ ] Preco final com taxas (gross-up): precoBase / (1 - feesPercent/100)
- [ ] Projecao mensal usa 200 unidades
- [ ] Navegacao entre steps funciona corretamente
- [ ] `useCalculatePricing` envia payload correto

## Examples

- Acessado via Home (quick access "Precificacao") ou rota `/pricing`.
- Fluxo: step 1 -> 2 -> 3 -> 4 -> 5 -> resultado -> salvar ou recalcular.

## Change log / Decisions

- Projecao mensal fixa em 200 unidades (nao editavel pelo usuario).
- Calculo feito no front para feedback instantaneo; POST de save envia ao backend para persistencia.
- Custo real: o step 1 pode puxar o `costPrice` de um produto (que vem da receita/insumos), em
  vez de digitar o custo na mao. O `productId` selecionado vai junto no POST de calculo.
- **Taxas de venda (iFood/cartão) em %** (step 5, opcional): aplicadas via **gross-up** sobre
  o preço de venda para preservar a margem. Inspirado em reviews do concorrente
  (`tasks/prd-melhorias-concorrente.md`).
