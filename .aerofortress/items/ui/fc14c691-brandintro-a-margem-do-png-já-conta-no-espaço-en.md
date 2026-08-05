---
id: fc14c691-2524-4f1d-b58f-490ada413585
slug: ui
type: scar
title: BrandIntro: a margem do PNG já conta no espaço entre casinha e nome
tags: mobile, brand-intro, logo, espacamento, splash, ui
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-04; apps/mobile/src/shared/components/brand-intro.tsx; lint direcionado e typecheck mobile aprovados
decay: stable
created: 2026-08-05T01:01:38.307835200+00:00
updated: 2026-08-05T01:01:38.307835200+00:00
validated: 2026-08-05T01:01:38.307835200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): na tela de abertura, a casinha aparecia longe demais do texto “Lucro Caseiro”. CAUSA: o PNG transparente já possui respiro visual e o estilo ainda adicionava `marginBottom: 26`, somando os dois espaços. CORREÇÃO CANÔNICA: manter os assets transparentes atuais e usar `marginBottom: 4` no logo do `BrandIntro`. COMO EVITAR: ao ajustar a composição da marca, avaliar a distância visível da arte, não apenas a caixa do componente; não compensar com troca/corte do asset correto.
