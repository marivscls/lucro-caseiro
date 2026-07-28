---
id: 73b53e60-7148-4b88-bc67-6d38d106be25
slug: ui
type: scar
title: Cards regenerados do Financeiro precisam de novo nome de asset para não duplicar setas
tags: financeiro, cards, assets, cache, setas, duplicidade, entradas, saidas, pwa
provenance: dito
evidence: Correções e capturas da usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx
decay: stable
created: 2026-07-25T21:38:41.118288200+00:00
updated: 2026-07-25T21:42:22.576049200+00:00
validated: 2026-07-25T21:42:22.576049200+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-25): (1) os fundos rosa e neutro/verde regenerados pertencem aos cards `Entradas` e `Saídas` do Financeiro, não ao seletor de Precificação; (2) após sobrescrever os PNGs mantendo os nomes antigos, o PWA mostrou duas setas por card — a seta antiga embutida no bitmap cacheado no topo e a nova seta renderizada em código. CORREÇÃO CANÔNICA: usar os fundos regenerados sem ícones sob novos nomes de asset para invalidar o cache, sobrepor rótulo/valor/descrição e renderizar somente uma seta direcional em código (`↓` Entradas, `↑` Saídas). COMO EVITAR: substituir visualmente um PNG cacheável sob o mesmo nome pode manter a versão anterior no PWA/dev; quando o conteúdo muda estruturalmente, versionar/renomear o asset e confirmar que apenas uma camada desenha o ícone.
