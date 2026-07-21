---
id: 24cbd298-a41c-4c01-a474-b5cc44e84df2
slug: ui
type: scar
title: Card Agenda da Home deve priorizar a quantidade sem truncar o período
tags: home, agenda, mobile, tipografia, truncamento, hierarquia-visual
provenance: dito
evidence: Correção da usuária e captura em 2026-07-20; apps/mobile/src/app/tabs/index.tsx
decay: stable
created: 2026-07-20T23:57:34.588327100+00:00
updated: 2026-07-20T23:57:34.588327100+00:00
validated: 2026-07-20T23:57:34.588327100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-20, captura móvel): o resumo do card Agenda terminava em “atrasad…” porque uma frase longa, limitada a três linhas, disputava a largura com o ícone, a ilustração 3D e a seta. CORREÇÃO: separar a quantidade em uma linha `bodyBold` de destaque, usar o período curto “Hoje, amanhã ou em atraso”, garantir `minWidth: 0` no bloco flexível e reduzir a ilustração em 10 px no mobile. COMO EVITAR: em cards horizontais ilustrados, a métrica deve ser o elemento textual mais visível e a explicação precisa caber inteira na menor largura suportada.
