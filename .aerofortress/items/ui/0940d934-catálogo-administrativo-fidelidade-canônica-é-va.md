---
id: 0940d934-b8d7-4b2d-9d40-a1f9a37a71a6
slug: ui
type: scar
title: Catálogo administrativo: fidelidade canônica é validada em 852×1838
tags: catalogo-administrativo, hero, responsividade, pwa, 852x1838, nao-publico
provenance: dito
evidence: apps/mobile/src/app/catalog.tsx; referência anexada pela usuária em 2026-08-16
decay: stable
created: 2026-08-17T02:05:33.287211300+00:00
updated: 2026-08-17T02:32:15.519281600+00:00
validated: 2026-08-17T02:32:15.519281600+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-16): a tarefa é exclusivamente sobre a tela administrativa `apps/mobile/src/app/catalog.tsx`; nunca alterar o catálogo público `/c/:slug`, o renderer SSR da API, backend ou dados ao ajustar esta composição. A fonte de verdade visual é a referência administrativa fornecida em 852×1838, e a aprovação exige captura local exatamente nessa viewport, comparação lado a lado e sobreposição a 50%. Em 852 px não há sidebar: conteúdo ~793–800 px, hero ~367 px, PNG único ~410–430 px com topOffset -35 a -45, card branco sobreposto 55–60 px, lista compacta e seção Sua identidade inteira antes da navbar. O PNG é filho absoluto do hero e usa apenas `top` negativo por faixa, nunca simultaneamente `bottom`, translate, margem negativa ou scale. Validações auxiliares: 500×936, 944×931, 1440×1000 e ultrawide.
