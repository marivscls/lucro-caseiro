---
id: fa43a70d-d4d4-4c92-9fa0-75cf91b84fce
slug: ui
type: scar
title: Prévia da vitrine não deve ter fundo ou grafismo preexistente
tags: catalogo, personalizador, capa, gradiente, overlay, estado-sem-capa, correcao-recorrente
provenance: dito
evidence: screenshot/correção da usuária 2026-08-18; apps/mobile/src/features/catalog/components/catalog-customizer.tsx
decay: stable
created: 2026-08-18T19:53:27.847003300+00:00
updated: 2026-08-18T20:18:50.683578400+00:00
validated: 2026-08-18T20:18:50.683578400+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-18): o pedido de remover o fundo vinho da prévia vale para todos os estados, com ou sem capa. A primeira tentativa apenas reduziu o sombreado; a segunda ocultou o SVG somente quando havia capa, fazendo o gradiente vinho/dourado e as linhas voltarem assim que a capa era removida. CORREÇÃO CANÔNICA: StorefrontPreview não deve renderizar o SVG decorativo, gradiente, paths nem superfície colorida preexistente em nenhum estado. Com capa, a imagem é a única superfície; sem capa, usar uma base neutra clara. O texto deve usar contraste adequado à base clara. COMO EVITAR: não condicionar a remoção visual a hasCover quando o pedido é eliminar o fundo do componente; validar explicitamente os estados com capa e sem capa.
