---
id: f19ad977-91e5-4fcf-bd82-2f28861e8018
slug: ui
type: scar
title: Modal com rodapé fixo precisa de respiro rolável após o último conteúdo
tags: mobile, modal, footer, scroll, safe-area, services
provenance: dito
evidence: Captura da usuária em 2026-08-04; apps/mobile/src/shared/components/standard-modal.tsx; apps/mobile/src/features/services/components/service-dashboard-modal.tsx
decay: stable
created: 2026-08-05T01:44:09.002452200+00:00
updated: 2026-08-05T01:44:09.002452200+00:00
validated: 2026-08-05T01:44:09.002452200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): no painel de Serviço, as informações inferiores ficavam escondidas pela barra/rodapé fixo e não podiam ser posicionadas acima dele para leitura. CORREÇÃO CANÔNICA: o `StandardModal` adiciona padding inferior maior ao conteúdo rolável quando existe footer, permitindo rolar o último bloco para uma área totalmente visível. COMO EVITAR: modais com rodapé fixo precisam reservar respiro dentro do ScrollView, além de separar o footer no flex layout.
