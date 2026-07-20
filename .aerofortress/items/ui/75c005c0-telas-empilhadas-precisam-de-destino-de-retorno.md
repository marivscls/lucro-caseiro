---
id: 75c005c0-68ec-4660-8375-ccc53dfa0407
slug: ui
type: scar
title: Telas empilhadas precisam de destino de retorno quando não há histórico
tags: navegacao, expo-router, pwa, mobile, voltar, etiquetas, clientes, cabecalho, responsividade
provenance: dito
evidence: Correções da usuária em 2026-07-20; apps/mobile/src/app/labels.tsx; apps/mobile/src/app/tabs/clients.tsx; padrão canônico em apps/mobile/src/app/products.tsx
decay: stable
created: 2026-07-20T22:32:54.579732800+00:00
updated: 2026-07-20T23:34:19.033616200+00:00
validated: 2026-07-20T23:34:19.033616200+00:00
links:
---

SINTOMA ORIGINAL (2026-07-20): na tela Etiquetas, tocar no botão de voltar não fazia nada. CAUSA: o `ScreenHeader` padrão chamava somente `router.back()`; quando a rota `/labels` era a raiz do histórico interno — por acesso direto, recarga ou retomada do PWA — não havia entrada anterior para remover. CORREÇÃO: a tela consulta `router.canGoBack()`; se houver histórico usa `router.back()`, caso contrário usa `router.replace("/tabs")` e expõe o rótulo acessível “Ir para o início”.

PRIMEIRA CORREÇÃO EM CLIENTES (2026-07-20): a lista, acessível por “Mais” e atalhos da Home, não tinha seta de voltar porque usava um cabeçalho próprio em vez do `ScreenHeader`. Foi adicionada uma ação móvel de 44 px com fallback para `/tabs/more`.

RECORRÊNCIA/CORREÇÃO DA USUÁRIA (2026-07-20): em Clientes, priorizar `router.back()` fazia a seta voltar para a Home quando a tela tinha sido aberta por esse histórico, mas o destino funcional esperado é sempre “Mais opções”. A seta de Clientes deve usar diretamente `router.replace("/tabs/more")`, independentemente do histórico. A inclusão da seta também apertou o cabeçalho de três blocos e quebrou “Clientes” antes da última letra; no mobile, o título precisa ser explicitamente de uma linha e o tamanho/espaçamentos do cabeçalho e do botão devem caber juntos na largura disponível.

COMO EVITAR: distinguir retorno histórico de destino canônico. Quando a usuária define o destino funcional da seta, não priorizar o histórico. Ao inserir navegação em um cabeçalho móvel que já contém título e ação, validar a composição completa na menor largura suportada e impedir quebra do título sem reduzir a área de toque de 44 px.
