---
id: f8d02de6-796e-4dbb-af3f-ecb8842d1e44
slug: ui
type: scar
title: Central de Marketing: mudança cosmética no grid não equivale a ajuste visual concluído
tags: web, central-de-marketing, dashboard, validacao-visual, densidade, hierarquia
provenance: dito
evidence: Correção e captura da usuária em 2026-07-16; apps/web/src/app/(dashboard)/page.tsx; apps/web/src/app/globals.css
decay: stable
created: 2026-07-16T19:30:46.051424100+00:00
updated: 2026-07-16T19:30:46.051424100+00:00
validated: 2026-07-16T19:30:46.051424100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-16): após a primeira revisão da Home, a usuária informou “não ajustou nada aqui” e enviou nova captura. Embora o grid inferior tivesse mudado, os problemas perceptivos centrais continuavam: painel da IA ainda excessivamente alto/vazio, indicadores largos para pouco conteúdo e hierarquia geral praticamente igual. COMO EVITAR: em pedidos de ajuste visual baseados em screenshot, validar o resultado perceptivo contra a nova composição (densidade, altura, hierarquia e equilíbrio), não encerrar porque houve mudança de spans/contraste ou porque lint/typecheck passaram; se a aparência continua essencialmente igual, a tarefa não está resolvida.
