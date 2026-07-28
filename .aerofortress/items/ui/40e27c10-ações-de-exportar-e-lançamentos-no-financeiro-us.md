---
id: 40e27c10-4b49-488e-8ac5-fada1a06eb67
slug: ui
type: scar
title: Ações de Exportar e Lançamentos no Financeiro usam densidade compacta
tags: financeiro, botoes, densidade, exportar, lancamentos, tipografia
provenance: dito
evidence: Correção visual da usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-07-25T19:36:05.634358300+00:00
updated: 2026-07-25T19:36:05.634358300+00:00
validated: 2026-07-25T19:36:05.634358300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): a área `Exportar`/`Lançamentos` ficou grande e deselegante porque títulos locais foram aumentados para 28 px, exportações tinham 66 px de altura, busca/CTA 48 px e chips 50 px, com gaps e raios largos. CORREÇÃO CANÔNICA: herdar `h2` padrão nos títulos; usar 48 px nos botões de exportação; 42 px em busca, novo lançamento e filtros; `bodyBold`/`captionBold` nos rótulos; gaps de 8 px e raios moderados. COMO EVITAR: referências ampliadas não devem criar uma escala paralela dentro da tela; ações auxiliares e filtros seguem a densidade canônica do app, deixando o destaque visual para o conteúdo financeiro.
