---
id: a163360e-82e9-47c7-8eae-6b9783d73cff
slug: ui
type: scar
title: Primeiros Passos: ícones dos três cards usam vinho uniforme também no PWA
tags: onboarding, primeiros-passos, pwa, react-native-web, tintcolor, icone, vinho, correcao
provenance: observado
evidence: Correção da usuária e validação CDP em 2026-08-24; apps/mobile/src/shared/components/getting-started-overlay.tsx; PWA bundle entry-abeaa371c853e868fefe554d8cba5d95.js
decay: stable
created: 2026-08-24T14:34:31.634850300+00:00
updated: 2026-08-24T15:19:25.452670100+00:00
validated: 2026-08-24T15:19:25.452670100+00:00
links: 
---

CORREÇÃO CANÔNICA MAIS RECENTE DA USUÁRIA (2026-08-24): os três ícones auxiliares dos cards do Primeiros Passos devem aparecer na mesma cor vinho oficial `#4A2332`. O mapeamento de formas permanece: etapa 1 usa documento com etiqueta `R$`, etapa 2 usa relatório/documento com três barras e brilho, etapa 3 usa gráfico crescente. IMPLEMENTAÇÃO CONFIRMADA: `tintColor` uniformiza no mobile, mas o React Native Web 0.81 não o aplicou ao `<img>` interno; no PWA, usar o alpha original como máscara visual com `drop-shadow(100px 0 0 #4A2332)` e deslocamento `translateX(-100px)` dentro do wrapper recortado. A validação CDP confirmou o mesmo `rgb(74, 35, 50)` nas três etapas. COMO EVITAR: não confiar apenas em `tintColor` para PNG no RN Web e não regenerar/degradar os assets para obter cor uniforme.
