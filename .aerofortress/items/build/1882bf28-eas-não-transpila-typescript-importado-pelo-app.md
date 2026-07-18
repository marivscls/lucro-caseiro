---
id: 1882bf28-e48d-426b-b1cc-205e79cbe51a
slug: build
type: scar
title: EAS não transpila TypeScript importado pelo app.config em pacote workspace
tags: eas, expo, whitelabel, monorepo
provenance: observado
evidence: EAS build 8368189f-f364-4927-92a6-11ee4e3fd400; apps/mobile/app.config.ts; packages/brands/src/lucro-papelaria/brand.json
decay: stable
created: 2026-07-18T19:28:34.560486400+00:00
updated: 2026-07-18T19:28:34.560486400+00:00
validated: 2026-07-18T19:28:34.560486400+00:00
links:
---

Sintoma: o EAS chegou a READ_APP_CONFIG e falhou com `Unexpected identifier 'BrandAdMobConfig'`, embora `expo config` local passasse. Causa: `app.config.ts` importava o source TypeScript de `@lucro-caseiro/brands`; o worker transpila o config, mas carregou a dependência workspace como JS. Correção: configs `brand.json` são canônicos; o package TS os tipa e o app.config lê o JSON diretamente via fs. Ao mudar config Expo em monorepo, valide também no EAS, não só localmente.
