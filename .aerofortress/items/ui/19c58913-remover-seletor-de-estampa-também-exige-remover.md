---
id: 19c58913-5f2c-4504-9356-6c6680cb5f6a
slug: ui
type: scar
title: Remover seletor de estampa também exige remover o padrão da prévia
tags: catalogo, preview, pattern, remocao-incompleta
provenance: dito
evidence: Correção da usuária com screenshot em 2026-07-13; apps/mobile/src/app/catalog.tsx
decay: stable
created: 2026-07-13T20:41:20.924725900+00:00
updated: 2026-07-13T20:41:20.924725900+00:00
validated: 2026-07-13T20:41:20.924725900+00:00
links:
---

SINTOMA (2026-07-13): após remover a seção “Estampa do topo” do Catálogo, a prévia continuou exibindo o quadriculado. CAUSA: o seletor e o estado local foram removidos, mas `HeroPreview` continuou recebendo `settings.pattern`, preservando a estampa salva. CORREÇÃO: a prévia deve receber `pattern={null}` e o salvamento da personalização deve limpar `pattern` para que a remoção seja efetiva. COMO EVITAR: ao retirar um controle visual, verificar todos os consumidores do valor persistido e não apenas o bloco que o edita.
