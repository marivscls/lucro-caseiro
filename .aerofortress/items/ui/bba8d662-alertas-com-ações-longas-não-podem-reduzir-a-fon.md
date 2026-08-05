---
id: bba8d662-d639-434e-a4a1-e209a838fe39
slug: ui
type: scar
title: Alertas com ações longas não podem reduzir a fonte para caber lado a lado
tags: mobile, alert, button, font, accessibility
provenance: dito
evidence: Captura da usuária em 2026-08-04; apps/mobile/src/shared/components/alert-host.tsx; apps/mobile/src/shared/components/alert-host.test.ts
decay: stable
created: 2026-08-05T01:44:08.848531300+00:00
updated: 2026-08-05T01:44:08.848531300+00:00
validated: 2026-08-05T01:44:08.848531300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): após registrar uma venda, o botão `Ver e compartilhar recibo` ficou com fonte minúscula porque duas ações dividiam igualmente uma caixa estreita e o Button reduzia o texto. CORREÇÃO CANÔNICA: o AlertHost empilha duas ações quando algum rótulo passa de 18 caracteres, dando largura total aos botões e preservando a tipografia legível; ações curtas continuam lado a lado. COMO EVITAR: não depender de `adjustsFontSizeToFit` para acomodar decisões importantes em diálogos móveis.
