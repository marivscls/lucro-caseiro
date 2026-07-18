---
id: 0e086f7c-f3ed-4921-a395-735900b5da6f
slug: build
type: scar
title: Vitest: aliases Expo que apontam ao mesmo stub compartilham o mock resolvido
tags: vitest, expo, mocks, aliases
provenance: observado
evidence: apps/mobile/vitest.config.ts; apps/mobile/src/test/setup.ts; apps/mobile/src/test/mocks/expo-stub.ts; falha observada e reteste 7/7 verde em 2026-07-16
decay: stable
created: 2026-07-17T01:27:36.451118700+00:00
updated: 2026-07-17T01:27:36.451118700+00:00
validated: 2026-07-17T01:27:36.451118700+00:00
links: 
---

SINTOMA (2026-07-16): após `use-auth.ts` passar a chamar `WebBrowser.maybeCompleteAuthSession()` no carregamento do módulo, a suíte completa falhou dizendo que `maybeCompleteAuthSession` não existia no mock de `expo-router`, embora `expo-web-browser` tivesse sido atualizado no stub. CAUSA: no `vitest.config.ts`, vários aliases Expo apontam para o mesmo arquivo `expo-stub.ts`; o `vi.mock("expo-router")` do setup atua sobre esse módulo resolvido compartilhado e também atende o import de `expo-web-browser`. CORREÇÃO: exports usados por qualquer alias compartilhado precisam existir no mock explícito de `expo-router` em `src/test/setup.ts` (e no stub). COMO EVITAR: ao adicionar chamada em tempo de importação a um módulo Expo aliasado, rodar a suíte completa e conferir tanto o stub quanto mocks explícitos que resolvem ao mesmo arquivo.
