---
id: 01fdaaac-61da-4d5e-8c81-66900939c2d8
slug: ui
type: scar
title: Boot React Native: pacote compartilhado não pode instalar uma segunda cópia do runtime
tags: android, react-native, react-devtools, renderer, monorepo, pnpm, peer-dependencies, expo-doctor, dedupe, boot
provenance: observado
evidence: packages/ui/package.json; pnpm-lock.yaml; apps/mobile/src/app/_layout.tsx; expo-doctor antes: duplicate react-native em app e packages/ui; depois: 18/18; Get-Item mostrou ambos os links para node_modules/.pnpm/react-native@0.81.5 com o mesmo contexto @babel/core@7.29.7; testes de 2026-07-13
decay: stable
created: 2026-07-13T04:10:17.038704300+00:00
updated: 2026-07-13T04:41:09.233597200+00:00
validated: 2026-07-13T04:41:09.233597200+00:00
links:
---

SINTOMAS (2026-07-13, Android/Fabric): no boot do Dev Client Samsung, LogBox em sequência com `ExceptionsManager should be set up after React DevTools`, `Cannot read property 'default' of undefined` em RendererImplementation/AnimatedProps e `property is not writable` no ReactDevToolsDispatcher. HIPÓTESES/CORREÇÕES QUE NÃO RESOLVERAM: reatribuição de `console.error`, LogBox global, LogBox atrasado em useEffect e carregamento tardio do IAP. CAUSA ESTRUTURAL OBSERVADA: `expo-doctor` encontrou duas instalações físicas de `react-native@0.81.5`, uma em `apps/mobile/node_modules` e outra em `packages/ui/node_modules`, resolvidas com contextos distintos de Babel/Metro; isso permite dois módulos de renderer/DevTools e é compatível com o `.default` indefinido/ciclo de inicialização. CORREÇÃO: `@lucro-caseiro/ui` declara React e React Native como `peerDependencies`; `pnpm dedupe` unificou Babel/Metro e ambos os links agora apontam para a mesma instância física do React Native. O workaround de LogBox foi removido para o boot não tocar no console. VALIDAÇÃO: Expo Doctor 18/18, typechecks UI/mobile, lint mobile e 294 testes passaram; Metro reiniciado com cache limpo. A confirmação visual no Samsung ainda estava pendente porque o aparelho não havia reconectado após o reinício.
