---
id: 75c005c0-68ec-4660-8375-ccc53dfa0407
slug: ui
type: scar
title: Telas empilhadas precisam de destino de retorno quando não há histórico
tags: navegacao, expo-router, pwa, mobile, voltar, etiquetas
provenance: dito
evidence: Correção da usuária em 2026-07-20; apps/mobile/src/app/labels.tsx; padrão canônico já observado em apps/mobile/src/app/products.tsx
decay: stable
created: 2026-07-20T22:32:54.579732800+00:00
updated: 2026-07-20T22:32:54.579732800+00:00
validated: 2026-07-20T22:32:54.579732800+00:00
links:
---

SINTOMA (2026-07-20): na tela Etiquetas, tocar no botão de voltar não fazia nada. CAUSA: o `ScreenHeader` padrão chamava somente `router.back()`; quando a rota `/labels` era a raiz do histórico interno — por acesso direto, recarga ou retomada do PWA — não havia entrada anterior para remover. CORREÇÃO: a tela consulta `router.canGoBack()`; se houver histórico usa `router.back()`, caso contrário usa `router.replace("/tabs")` e expõe o rótulo acessível “Ir para o início”. COMO EVITAR: telas empilhadas acessíveis por URL/atalho não podem depender exclusivamente de `back()`; devem declarar um destino canônico de fallback e manter o retorno normal quando o histórico existir.
