---
id: 8906f541-9f6f-4a7d-bb15-c5e3ca66d7a6
slug: ui
type: scar
title: Dashboard: validar o selo IDEIA na linha real, nunca em fixture curta
tags: web, dashboard, badge, grid, css, validacao-visual, correcao, fixture, hmr
provenance: dito
evidence: Captura corretiva da usuária C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\b1804057-7a9e-4bf6-a4c5-1a12448029c9.png em 2026-07-17; validação anterior em fixture curto mediu 47.125×25 px mas não reproduziu a linha real.
decay: stable
created: 2026-07-18T00:14:30.844278500+00:00
updated: 2026-07-18T00:32:08.313027400+00:00
validated: 2026-07-18T00:32:08.313027400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-17): após declarar o selo “IDEIA” corrigido em 47 × 25 px, a captura real de “Próximas peças” mostrou que ele continuava esticado verticalmente conforme a altura do texto de cada linha. A validação anterior foi inválida: mediu um fixture artificial cuja linha tinha apenas 25 px de altura e, portanto, não exercitou o alongamento; também não comprovou a rota autenticada vista pela usuária. O wrapper neutro e a restauração do estilo canônico podem estar corretos no fonte, mas não contam como entrega enquanto a linha real, com título e resumo multilinha, não renderizar todos os selos em 47 × 25 px. COMO EVITAR: reproduzir a altura real da linha no teste (conteúdo multilinha ou célula explicitamente alta), medir o `.status` e sua célula separadamente, conferir o DOM/CSS efetivamente servido no mesmo host da usuária e reiniciar `next dev` após alterações de `next.config.ts`; nunca concluir por um fixture que não reproduz a condição do bug.
