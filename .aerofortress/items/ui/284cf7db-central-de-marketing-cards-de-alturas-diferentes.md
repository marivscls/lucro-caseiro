---
id: 284cf7db-dfdb-4d80-bb2c-405217cb30b1
slug: ui
type: scar
title: Central de Marketing: cards de alturas diferentes precisam de colunas independentes
tags: web, central-de-marketing, dashboard, grid, responsividade, altura-natural
provenance: observado
evidence: Capturas e correção da usuária em 2026-07-16; apps/web/src/app/(dashboard)/page.tsx; apps/web/src/app/globals.css; typecheck e lint web aprovados; endpoint / respondeu HTTP 200
decay: stable
created: 2026-07-16T19:26:22.993297700+00:00
updated: 2026-07-16T19:32:52.771989400+00:00
validated: 2026-07-16T19:32:52.771989400+00:00
links:
---

SINTOMA (2026-07-16): na Home da Central de Marketing, o painel da IA era esticado até a altura da lista de próximas peças e acumulava uma grande área vazia; grades por linha continuaram parecendo praticamente iguais mesmo após trocar os spans para 12 colunas. CAUSA: CSS Grid acopla a altura dos itens da mesma linha; mudar apenas 8/4 e 6/6 não remove esse acoplamento. CORREÇÃO CANÔNICA: duas colunas independentes no desktop — esquerda com Próximas peças + Onde chegar, direita com IA + Documentos recentes — cada uma com sua própria pilha e altura natural. Em tablet/celular, display:contents permite reordenar para Próximas peças → IA → Onde chegar → Documentos. Metadados pequenos usam contraste reforçado e o gradiente da IA permanece escuro. COMO EVITAR: quando cards têm densidades muito diferentes, não tentar equilibrá-los apenas com spans dentro das mesmas linhas; usar pilhas independentes e validar a aparência resultante.
