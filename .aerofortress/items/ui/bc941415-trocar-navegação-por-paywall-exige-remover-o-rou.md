---
id: bc941415-945d-48f9-bef3-fcf50683d7ac
slug: ui
type: scar
title: Trocar navegação por paywall exige remover o router órfão
tags: checkout, lint, react-native
provenance: observado
evidence: apps/mobile/src/app/support.tsx; ESLint @typescript-eslint/no-unused-vars/sonarjs em 2026-07-25
decay: stable
created: 2026-07-26T00:33:54.522981800+00:00
updated: 2026-07-26T00:33:54.522981800+00:00
validated: 2026-07-26T00:33:54.522981800+00:00
links:
---

FALHA REAL (2026-07-25): ao substituir `router.push('/plans')` por `showPaywall(...)` na tela de Suporte, o import de `useRouter` e a variável `router` ficaram órfãos; o ESLint bloqueou a validação. CORREÇÃO: remover import e declaração junto com a troca do handler. COMO EVITAR: toda substituição de navegação/hook deve incluir a limpeza dos imports e variáveis antigas e rodar ESLint nos arquivos tocados.
