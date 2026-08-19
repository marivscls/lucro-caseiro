---
id: b4dfa634-9085-4102-9c67-4aeebe01cc47
slug: ui
type: scar
title: Referência visual anexada pertence à tela mostrada, não à tarefa anterior
tags: attachments, purchases, fiado, empty-state, png, context
provenance: dito
evidence: Capturas da usuária em 2026-08-14 mostrando a sacola e a tela `Compras`; apps/mobile/src/app/purchases.tsx; apps/mobile/src/app/fiado.tsx; bundle PWA Revenda entry-9eb9dde1f9ff4ecd823f2d06225bdb0e.js confirma 220/240 nos dois estados vazios; typecheck, lint e build:pwa:revenda aprovados
decay: stable
created: 2026-08-14T17:38:50.409441+00:00
updated: 2026-08-14T17:46:26.905425200+00:00
validated: 2026-08-14T17:46:26.905425200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-14): após pedir que “o PNG” ficasse do tamanho das outras telas e anexar uma captura da sacola azul em Compras, a referência foi associada incorretamente à tarefa anterior de Fiado. Isso reduziu o porquinho de Fiado para 146×146 e deixou a sacola de Compras pequena. CORREÇÃO: a captura identifica a própria tela afetada; Compras passou de 146×146 para o padrão 220×220 no mobile e 240×240 no desktop, e Fiado foi restaurado aos mesmos valores. COMO EVITAR: em sequências de ajustes visuais, mapear cada captura pelo conteúdo e pelo título exibido antes de editar; não herdar automaticamente o alvo do pedido anterior.
