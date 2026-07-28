# Desktop screen checklist (referência: Precificação)

Critérios “capricho Precificação”:
1. Zona data 1280 (`desktopStretch` / `desktopSplitLayout.outer`) — sem ilha `form` 1040 centrada
2. Form + resumo → `desktopSplitLayout` (aside sticky ~400) com CTAs no aside
3. Dinheiro/qty → `desktopCompactField` (~360)
4. Busca desktop → maxWidth ~480, alinhada à esquerda
5. Listas de cards → 2–3 colunas
6. Mobile inalterado

| # | Tela | Arquivo | Status |
|---|---|---|---|
| 1 | Precificação | `pricing` + calculators | OK |
| 2 | Nova Venda | `tabs/new-sale.tsx` | OK — split + aside resumo + grids |
| 3 | Catálogo | `catalog.tsx` | OK |
| 4 | Orçamento (form) | `quote-form.tsx` | OK |
| 5 | Etiqueta (form) | `create-label-form.tsx` | OK |
| 6 | Novo produto | `create-product-form.tsx` | OK — split + aside preço |
| 7 | Pedido (modal) | `order-form.tsx` | OK |
| 8 | Lançamento financeiro | `create-finance-entry.tsx` | OK |
| 9 | Nova compra | `create-purchase-form.tsx` | OK |
| 10 | Fornecedor | `create-supplier-form.tsx` | OK |
| 11 | Insumo / Embalagem / Receita | material/packaging/recipe forms | OK |
| 12 | Editar cliente | `edit-client-form.tsx` | OK |
| 13 | Gastos fixos | `recurring-expenses.tsx` | OK |
| 14 | Configurações | `settings.tsx` | OK |
| 15 | Planos / Suporte | `plans.tsx` / `support.tsx` | OK |
| 16 | Vendas | `tabs/sales.tsx` | OK |
| 17 | Clientes | `tabs/clients.tsx` | OK |
| 18 | Agenda | `tabs/agenda.tsx` | OK |
| 19 | Financeiro | `finance-dashboard.tsx` | OK |
| 20 | Produtos | `products.tsx` | OK |
| 21 | Insumos / Embalagens / Receitas | lists | OK |
| 22 | Fiado / Compras / Orçamentos / Etiquetas | lists | OK |
| 23 | Home / Mais | `tabs/index` / `more` | OK |
| 24 | Insights / Retail / Admin | dashboards | OK |
| 25 | Detalhe cliente | `client-detail.tsx` | OK |
| 26 | Fornecedores | supplier list/table | OK |
