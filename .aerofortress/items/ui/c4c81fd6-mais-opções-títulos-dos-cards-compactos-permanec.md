---
id: c4c81fd6-dd20-4fcc-bb79-f4390e77b282
slug: ui
type: scar
title: Mais opções: títulos dos cards compactos permanecem em uma linha
tags: mais-opcoes, responsividade, tipografia, pwa, mobile
provenance: dito
evidence: apps/mobile/src/app/tabs/more.tsx; .aerofortress/more-options-validation/more-titles-{320,430,480,1280}.png
decay: stable
created: 2026-08-25T01:18:05.445325600+00:00
updated: 2026-08-25T01:18:05.445325600+00:00
validated: 2026-08-25T01:18:05.445325600+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-08-24): na seção “Gestão do negócio” da tela Mais opções, títulos como “Gastos fixos”, “Orçamentos” e “Embalagens” não podem quebrar em duas linhas nem separar uma palavra. CAUSA: o texto do título não tinha uma restrição explícita de linha, então a largura calculada pelo RN Web/mobile permitia a quebra. CORREÇÃO: o título do ToolCard usa `numberOfLines={1}` e, nos cards não primários, `adjustsFontSizeToFit` com `minimumFontScale={0.82}`; a variante e o layout horizontal existentes foram preservados. Verificar visualmente em 320, 430, 480 e desktop, confirmando uma linha e ausência de corte/reticências nos títulos exibidos.
