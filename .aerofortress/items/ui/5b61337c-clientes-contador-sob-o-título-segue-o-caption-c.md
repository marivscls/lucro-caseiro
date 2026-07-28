---
id: 5b61337c-b8f7-4876-b757-f78539b0179b
slug: ui
type: scar
title: Clientes: contador sob o título segue o caption canônico
tags: clientes, cabecalho, tipografia, caption, contador, padrao-visual
provenance: dito
evidence: Captura e pedido da usuária em 2026-07-26; apps/mobile/src/app/tabs/clients.tsx
decay: stable
created: 2026-07-26T03:34:06.988749700+00:00
updated: 2026-07-26T03:34:06.988749700+00:00
validated: 2026-07-26T03:34:06.988749700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): o contador “19 CLIENTES CADASTRADOS” em caixa alta e com espaçamento exagerado entre letras destoava dos demais cabeçalhos. CORREÇÃO CANÔNICA: abaixo de “Clientes”, exibir “{total} clientes cadastrados” com a variante `caption`, sem `textTransform` de label e sem `letterSpacing` local. COMO EVITAR: textos auxiliares sob títulos de tela devem herdar o padrão de subtítulo do `ScreenHeader`; não criar uma estética editorial em caixa alta para contagens.
