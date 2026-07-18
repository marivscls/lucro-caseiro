---
id: b90b5700-be69-4b3c-a3f6-da5df9285b00
slug: build
type: scar
title: Landing: arrays `as const` precisam declarar flags opcionais em todos os itens
tags: typescript, web, landing, as-const, typecheck, lint
provenance: observado
evidence: apps/web/src/features/landing/landing-page.tsx; pnpm --filter @lucro-caseiro/web typecheck; pnpm --filter @lucro-caseiro/web lint
decay: stable
created: 2026-07-17T00:31:54.789985+00:00
updated: 2026-07-17T00:32:23.289419400+00:00
validated: 2026-07-17T00:32:23.289419400+00:00
links: 
---

SINTOMA (2026-07-16): os gates iniciais da nova landing falharam em dois pontos: o typecheck não permitiu acessar `plan.featured` porque somente o plano Essencial declarava a propriedade no array `plans as const`; depois o lint encontrou `Clock3` importado sem uso. CAUSA: o TypeScript inferiu uma união em que Gratuito e Profissional não possuíam a chave, e a lista de ícones ficou maior que o JSX final. CORREÇÃO: declarar `featured: false` explicitamente nos demais itens e remover o import não utilizado. COMO EVITAR: em arrays literais `as const` renderizados uniformemente, mantenha o mesmo shape em todos os objetos ou declare um tipo compartilhado; após fechar a composição, alinhe imports de ícones ao JSX antes dos gates.
