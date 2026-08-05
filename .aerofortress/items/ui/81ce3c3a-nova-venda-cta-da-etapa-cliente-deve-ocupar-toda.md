---
id: 81ce3c3a-65b9-44a3-bd81-c9f081286420
slug: ui
type: scar
title: Nova Venda: CTA da etapa Cliente deve ocupar toda a largura do rodapé móvel
tags: mobile, nova-venda, cta, footer, spacing, android
provenance: dito
evidence: Captura enviada pela usuária em 2026-08-04; apps/mobile/src/app/tabs/new-sale.tsx; lint direcionado, typecheck mobile e git diff --check aprovados
decay: stable
created: 2026-08-05T02:05:09.439710200+00:00
updated: 2026-08-05T02:05:09.439710200+00:00
validated: 2026-08-05T02:05:09.439710200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): na primeira etapa de Nova Venda, o rodapé fixo ocupava toda a largura, mas o botão `Próximo` tinha apenas `minWidth: 138` e ficava alinhado à direita, deixando uma grande área branca vazia à esquerda. CORREÇÃO CANÔNICA: no mobile, o CTA de navegação usa `flex: 1` também na etapa 1, preenchendo a largura útil do rodapé; as etapas com dois botões continuam dividindo o espaço. COMO EVITAR: não aplicar largura mínima isolada a um único CTA dentro de um footer full-width; CTAs únicos em rodapés móveis devem expandir.
