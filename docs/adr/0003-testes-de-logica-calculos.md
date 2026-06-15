# ADR/PRD 0003 — Testes de Lógica (Cálculos e Regras) por Tela

> **Tipo:** ADR (decisão) + PRD (especificação de testes de lógica)
> **Status:** Aceito · **Data:** 2026-06-15 · **Escopo:** `apps/mobile`
> **Relacionado:** [ADR 0001 — Plano de Testes das Telas](./0001-plano-de-testes-telas.md) · [ADR 0002 — Regras de Validação](./0002-regras-de-validacao-telas.md)
> **Objetivo:** Garantir que **toda lógica de cálculo e regra de negócio que roda no cliente (mobile)** esteja coberta por **testes unitários puros**, para nenhuma tela com conta (preço, custo, total, lucro, validação) ir para produção sem verificação.

---

## 1. Contexto

O ADR 0001 (§7.1) já previa "automatizar agora os itens de domínio/formatação em testes puros". Boa parte das telas com conta **calcula no backend** (sales, recipes, pricing, finance, quotes têm `*.domain.ts` testado em `apps/api`), mas o **cliente recalcula** localmente para preview em tempo real (ex.: total do carrinho, preço sugerido, lucro, total do orçamento, lucro do mês). Essa lógica de cliente **não tinha cobertura** e podia divergir do backend.

Esta decisão cataloga, por feature, **o que o cliente calcula**, e exige que essa lógica viva em **módulo puro** (`*.ts`, sem React Native) coberto por Vitest.

## 2. Decisão

1. Toda conta/regra que roda no cliente deve estar numa **função pura** num módulo testável (não embutida só no componente).
2. Cada módulo puro de cálculo tem `*.test.ts` (AAA, SUT factory, sem mocks) cobrindo happy path + **casos de borda** (zero, vazio, divisão por zero, decimal, negativo).
3. Quando o cálculo também existe no backend, o teste do cliente deve **espelhar o comportamento** do `*.domain.ts` correspondente (ex.: custo nulo conta 0; arredondamento em centavos).
4. O componente passa a **consumir a função pura** (fonte única), nunca uma cópia inline.

## 3. Inventário: o que cada tela calcula no cliente

| Feature / Tela            | Cálculo/Regra no cliente                                                                    | Módulo puro                           | Backend equivalente   |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------- |
| **Produtos / kit**        | custo total do kit (Σ custo×qtd), validação, label do chip                                  | `products/kit.ts` ✅                  | `products.domain.ts`  |
| **Precificação**          | custo mão de obra, custo total, preço sugerido, lucro, taxas %, **preço final c/ gross-up** | `pricing/calc.ts`                     | `pricing.domain.ts`   |
| **Nova venda / carrinho** | total do carrinho (Σ preço×qtd), subtotal, peso (kg)                                        | `sales/cart.ts`                       | `sales.domain.ts`     |
| **Orçamentos**            | total (Σ qtd×preço arredondado em centavos), mensagem WhatsApp                              | `quotes/calc.ts`, `quotes/message.ts` | `quotes.domain.ts`    |
| **Financeiro**            | lucro (receitas−despesas), **delta % vs mês anterior**, contagem por tipo                   | `finance/calc.ts`                     | `finance.domain.ts`   |
| **Insights**              | `R$ X mil` curto, label de mês, máximo da série (guarda /0)                                 | `insights/domain.ts`                  | — (exibição)          |
| **Vendas (pagamento)**    | rótulo da forma de pagamento (fallback)                                                     | `sales/payment.ts`                    | —                     |
| **Rótulos (nutrição)**    | tem nutrição? / limpar nutrição vazia                                                       | `labels/nutrition.ts`                 | —                     |
| **Encomendas**            | instante do lembrete (véspera 9h; pula passado/finalizada)                                  | `orders/reminders.ts`                 | — (notificação local) |

> Já cobertos antes deste ADR: `sales/fiado.ts`, `sales/receipt.ts`, `sales/receipt-pdf.ts`, `materials/domain.ts`, `goals/domain.ts`, `orders/domain.ts`, `labels/qr.ts`, `products/kit.ts`, e utils compartilhados (`format`, `date`, `phone`, `whatsapp`).

## 4. Especificação dos casos de teste (mínimos)

### 4.1 Precificação — `pricing/calc.ts`

- `laborCost(min, hora)`: 0 min → 0; 60 min × R$30 → 30; 90 min × R$20 → 30.
- `totalCost(ingr, emb, mão, fixo)`: soma; todos 0 → 0.
- `suggestedPrice(custo, margem%)`: custo 0 → 0; margem 0 → custo; 100% dobra.
- `profitPerUnit(preço, custo)`: preço−custo.
- `finalPriceWithFees(preço, taxas%)`: taxa 0 → preço, taxa 0; **taxa ≥ 100 → sem gross-up (sem ÷0)**; taxa 20% → preço/0,8.

### 4.2 Carrinho — `sales/cart.ts`

- `cartTotal([])` → 0; itens múltiplos somam; **peso decimal** (1,5 kg × R$80 = 120).
- `itemSubtotal(preço, qtd)`: inteiro, decimal, preço 0.
- `formatWeight(kg)`: `1`→"1 kg"; `1,5`; trunca em 3 casas.

### 4.3 Orçamentos — `quotes/calc.ts` + `quotes/message.ts`

- `computeQuoteTotal([])` → 0; arredonda em centavos; quantidade decimal.
- `buildQuoteMessage`: subtotal por item, total, validade `DD/MM/AAAA`, observações, saudação.

### 4.4 Financeiro — `finance/calc.ts`

- `profit(rec, desp)`: 0/0→0; só receita; só despesa (negativo).
- `profitDeltaPct(lucro, lucroAnt)`: anterior 0 → **null** (sem /0); +100%; −50%.
- `countByType(entries)`: vazio → 0/0; conta income/expense.

### 4.5 Insights — `insights/domain.ts`

- `formatMoneyShort`: 350 → "R$ 350"; 1200 → "R$ 1,2 mil".
- `monthLabel("2026-05")` → "mai".
- `maxRevenue([])` → 1 (guarda /0); pega o maior.

### 4.6 Pagamento — `sales/payment.ts`

- `paymentLabel("pix")` → "Pix"; `paymentLabel("credit")` → "Fiado"; valor cru desconhecido → ele mesmo.

### 4.7 Nutrição — `labels/nutrition.ts`

- `hasNutrition`: null/vazio → false; um campo preenchido → true.
- `cleanNutrition`: vazio → undefined; com dado → mantém.

### 4.8 Encomendas — `orders/reminders.ts`

- `reminderInstant(data, agora)`: véspera às 9h; data no passado → null; data inválida → null.
- `shouldScheduleReminder(order, agora)`: `done`/`cancelled` → false; futura → true.

## 5. Consequências

- **Prós:** divergência cliente×backend detectável; regressão de conta barrada no `prepush`/CI; cálculo reutilizável (fonte única).
- **Contras:** exige extrair lógica de alguns componentes para módulos puros (refactor pontual, sem mudança de comportamento).

## 6. Status de implementação (2026-06-15)

- [x] `products/kit.ts` + `kit.test.ts`
- [x] `pricing/calc.ts` + `calc.test.ts`
- [x] `sales/cart.ts` + `cart.test.ts`
- [x] `quotes/calc.ts` + `calc.test.ts` · `quotes/message.test.ts`
- [x] `finance/calc.ts` + `calc.test.ts`
- [x] `insights/domain.test.ts`
- [x] `sales/payment.test.ts`
- [x] `labels/nutrition.test.ts`
- [x] `orders/reminders.ts` (helper puro) + `reminders.test.ts`

## 7. Manutenção

- Toda tela nova com conta/regra: criar/estender o módulo puro + `*.test.ts` e atualizar a tabela §3.
- Cálculo de cliente que também exista no backend deve referenciar o comportamento do `*.domain.ts` no teste.
