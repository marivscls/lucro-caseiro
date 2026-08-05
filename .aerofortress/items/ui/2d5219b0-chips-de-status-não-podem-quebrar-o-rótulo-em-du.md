---
id: 2d5219b0-5dc5-409f-bf29-33ca29bfdf81
slug: ui
type: scar
title: Chips de status não podem quebrar o rótulo em duas linhas
tags: ui, mobile, android, chip, texto, quebra-de-linha
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-04; packages/ui/src/components/chip.tsx; typechecks de @lucro-caseiro/ui e @lucro-caseiro/mobile aprovados
decay: stable
created: 2026-08-04T11:12:27.617911300+00:00
updated: 2026-08-04T11:12:27.617911300+00:00
validated: 2026-08-04T11:12:27.617911300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): o chip `Contato feito` no painel de serviço aparecia com `Contato` e `feito` em linhas separadas, embora a pílula tivesse espaço visual. CAUSA NO CÓDIGO: o `Chip` compartilhado permitia quebra normal do `<Text>`; em uma linha flexível com `flexBasis` compacto, o Android podia medir o texto pela largura-base antes de o contêiner crescer. CORREÇÃO CANÔNICA: o rótulo do `Chip` usa `numberOfLines={1}` no componente compartilhado. COMO EVITAR: rótulos curtos de chips/pílulas de ação devem declarar uma única linha no componente canônico; não criar exceções por tela.
