# ADR-0005 — Essencial ganha exportação PDF básica (`exportBasic`)

**Status:** aceito (2026-07-11) · **Contexto:** PRD melhorias pré-lançamento, item 2.1

## Contexto

O Essencial (R$ 29,90) só removia limites de volume — nenhum recurso qualitativo novo sobre o Free. A escada de valor ficava fina e o salto pro Profissional (R$ 69,90, 2,3×) sem degrau intermediário. A dona do produto aprovou dar ao Essencial "um PDF mais básico".

## Decisão

Nova feature na matriz (`packages/contracts`): **`exportBasic`** — exportar o **resumo mensal em PDF simples** (fechamento do mês: receitas, gastos, lucro), disponível em **Essencial e Profissional**.

O `export` completo (XLSX, relatórios avançados com gráficos, histórico) permanece exclusivo do **Profissional**, assim como todas as demais features premium.

## Consequências

- Essencial passa a ter 1 diferencial qualitativo tangível além da remoção de limites; copy da tela de planos e `plan-benefits` atualizados.
- Enforcement no backend (guard por feature), como toda regra freemium; o front apenas projeta.
- Fronteira clara a manter: se o PDF básico crescer (gráficos, períodos custom), isso é `export`/Profissional — não inflar o `exportBasic`.
