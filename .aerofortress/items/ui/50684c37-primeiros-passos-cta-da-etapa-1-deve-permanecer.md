---
id: 50684c37-7b44-4154-b0ee-102282dea997
slug: ui
type: scar
title: Primeiros Passos: CTA da Etapa 1 deve permanecer com 60 px em 320 px
tags: onboarding, responsive, cta, 320px
provenance: observado
evidence: apps/mobile/src/shared/components/getting-started-overlay.tsx; .aerofortress/onboarding-stage1-validation.json
decay: stable
created: 2026-08-24T14:15:59.578264600+00:00
updated: 2026-08-24T14:15:59.578264600+00:00
validated: 2026-08-24T14:15:59.578264600+00:00
links: 
---

FALHA CORRIGIDA (2026-08-24): na validação real em 320 px, “Cadastrar primeiro produto” quebrou e aumentou o CTA de 60 para 84 px, embora 360+ estivesse correto. CAUSA: soma do rótulo Manrope 18, seta, gap e padding excedia a largura interna. CORREÇÃO: em `<360`, manter largura total, reduzir o rótulo somente para 17 px, zerar padding horizontal e usar gap de 8 px; a medição final confirmou 272×60 px sem overflow.
