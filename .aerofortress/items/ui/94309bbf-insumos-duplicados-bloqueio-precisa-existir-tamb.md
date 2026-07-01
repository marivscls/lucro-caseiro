---
id: 94309bbf-ab91-45e6-89fe-ed9081ead258
slug: ui
type: scar
title: Insumos duplicados: bloqueio precisa existir também na tela
tags: duplicidade, insumos, formulario
provenance: dito
evidence: Relato da usuária em 2026-06-30 com screenshot da tela de Insumos mostrando múltiplas 'Farinha de trigo'; fix em apps/mobile/src/features/materials/components/material-form.tsx e apps/mobile/src/app/materials.tsx
decay: stable
created: 2026-06-30T14:49:55.336601900+00:00
updated: 2026-06-30T14:49:55.336601900+00:00
validated: 2026-06-30T14:49:55.336601900+00:00
links: 
---

Falha real: após implementar bloqueio de duplicidade de insumos no backend, a usuária ainda conseguiu cadastrar várias 'Farinha de trigo' pela tela de Insumos. Para evitar repetir, toda regra de duplicidade que afeta a experiência imediata precisa ter defesa local no formulário além da validação da API, usando a lista carregada e uma busca pelo nome digitado antes do submit.
