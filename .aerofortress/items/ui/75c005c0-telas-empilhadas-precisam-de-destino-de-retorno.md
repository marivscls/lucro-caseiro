---
id: 75c005c0-68ec-4660-8375-ccc53dfa0407
slug: ui
type: scar
title: Telas empilhadas precisam de destino de retorno quando não há histórico
tags: navegacao, expo-router, pwa, mobile, voltar, etiquetas, clientes, cabecalho
provenance: dito
evidence: Correções da usuária em 2026-07-20; apps/mobile/src/app/labels.tsx; apps/mobile/src/app/tabs/clients.tsx; padrão canônico em apps/mobile/src/app/products.tsx
decay: stable
created: 2026-07-20T22:32:54.579732800+00:00
updated: 2026-07-20T23:25:22.540686600+00:00
validated: 2026-07-20T23:25:22.540686600+00:00
links:
---

SINTOMA ORIGINAL (2026-07-20): na tela Etiquetas, tocar no botão de voltar não fazia nada. CAUSA: o `ScreenHeader` padrão chamava somente `router.back()`; quando a rota `/labels` era a raiz do histórico interno — por acesso direto, recarga ou retomada do PWA — não havia entrada anterior para remover. CORREÇÃO: a tela consulta `router.canGoBack()`; se houver histórico usa `router.back()`, caso contrário usa `router.replace("/tabs")` e expõe o rótulo acessível “Ir para o início”.

RECORRÊNCIA/CORREÇÃO DA USUÁRIA (2026-07-20): a lista de Clientes, acessível por “Mais” e atalhos da Home, não tinha seta de voltar porque usava um cabeçalho próprio em vez do `ScreenHeader`. CORREÇÃO: adicionar ao cabeçalho móvel uma ação de 44px que volta pelo histórico e, em acesso direto, usa `/tabs/more` como destino canônico; o desktop permanece sem cabeçalho móvel duplicado.

COMO EVITAR: telas empilhadas acessíveis por URL/atalho não podem depender exclusivamente de `back()` nem omitir retorno por terem cabeçalho customizado. Toda variante móvel deve oferecer a seta e um destino canônico de fallback.
