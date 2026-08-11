---
id: 7afcbb99-4223-48bb-b117-d5ff05b63e4a
slug: ui
type: scar
title: Lima de marca não pode substituir o sucesso global
tags: paleta, lima, success, tema, home
provenance: dito
evidence: Relato da usuária em 2026-08-10; packages/brands/src/lucro-caseiro/brand.json; packages/ui/src/theme.ts; apps/mobile/src/app/tabs/index.tsx; teste de tema aprovado
decay: stable
created: 2026-08-11T00:57:56.465570400+00:00
updated: 2026-08-11T00:57:56.465570400+00:00
validated: 2026-08-11T00:57:56.465570400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-10): ao promover o lima da nova paleta para os tokens globais de `success` da marca Lucro Caseiro, o verde apareceu em botões, estados e superfícies por todo o app, contrariando a intenção de usá-lo apenas em alguns lugares. CORREÇÃO CANÔNICA: manter `success`/`successBg` nos verdes semânticos compartilhados e aplicar o lima localmente apenas em microdestaques deliberados da Home. Não usar fundo lima em card inteiro; no card de lucro positivo, manter superfície neutra e limitar o acento ao ícone claro. Antes de alterar um token semântico compartilhado, buscar todos os consumidores e avaliar a propagação visual.
