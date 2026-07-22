---
id: 9666cc0c-0489-474a-8436-a557495a1f8a
slug: auth
type: scar
title: PWA com token expirado deve renovar a sessão e repetir o request uma vez
tags: pwa, 401, token-refresh, api-client, profile, supabase, tests
provenance: observado
evidence: Railway HTTP logs de 2026-07-22T20:50–20:52Z; apps/mobile/src/shared/utils/api-client.ts; apps/mobile/src/shared/utils/api-client.test.ts; apps/mobile/src/test/setup.ts; 355 testes, typecheck, lint e build PWA aprovados
decay: stable
created: 2026-07-22T21:19:55.861098400+00:00
updated: 2026-07-22T21:19:55.861098400+00:00
validated: 2026-07-22T21:19:55.861098400+00:00
links:
---

SINTOMA (2026-07-22): ao salvar “Editar perfil” no PWA, a UI mostrou “Não foi possível atualizar o perfil”. Os HTTP logs do Railway confirmaram vários PATCH `/api/v1/subscription/profile` com 401 em 3–26 ms; não era validação dos campos nem banco. CAUSA: ao voltar para um PWA inativo, a primeira chamada podia usar o access token antigo antes do auto-refresh do Supabase atualizar o token mantido pelo Zustand. CORREÇÃO: `apiClient` trata 401 autenticado chamando `supabase.auth.refreshSession()` e repete a mesma chamada uma única vez com o novo access token; se o refresh falhar ou o retry continuar 401, preserva o erro original, sem auto-logout global. TESTE: o primeiro teste quebrou porque o mock global de `@supabase/supabase-js` não expunha `refreshSession`; ao adicionar uso novo de Auth, atualizar `src/test/setup.ts` junto e manter regressão que prova os dois tokens nos dois requests.
