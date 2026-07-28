---
id: 19202bc0-8564-47e4-8b9f-4fd4b11c8b3a
slug: ui
type: scar
title: Melhorias internas em telas existentes não podem ser apresentadas como transformação visível do produto
tags: ui, entrega, discoverability, comunicacao
provenance: dito
evidence: apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/mobile/src/app/insights.tsx
decay: stable
created: 2026-07-24T23:30:58.775856100+00:00
updated: 2026-07-24T23:30:58.775856100+00:00
validated: 2026-07-24T23:30:58.775856100+00:00
links:
---

SINTOMA (2026-07-24): a entrega foi resumida como implementação de todo o pacote recomendado, mas a usuária abriu o PWA e não encontrou mudanças evidentes. O diff alterou principalmente fluxos já existentes, não redesenhou a Home, e algumas novidades só aparecem em telas internas ou sob condições de dados/plano. COMO EVITAR: ao entregar mudanças de UX, distinguir claramente o que foi criado, o que apenas reorganizou comportamento existente e o que é condicional; informar o caminho exato para conferir cada mudança e não chamar ajustes incrementais de implementação integral.
