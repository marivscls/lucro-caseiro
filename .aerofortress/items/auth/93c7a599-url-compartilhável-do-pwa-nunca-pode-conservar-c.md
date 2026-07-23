---
id: 93c7a599-87a9-4da2-baed-b54d5f0025ee
slug: auth
type: scar
title: URL compartilhável do PWA nunca pode conservar credenciais de autenticação
tags: auth, pwa, security, oauth, url, token-leak
provenance: dito
evidence: Correção da usuária em 2026-07-22; apps/mobile/src/shared/utils/auth-url.ts; apps/mobile/src/shared/hooks/use-auth.ts; apps/mobile/src/shared/utils/supabase.ts
decay: stable
created: 2026-07-23T00:05:00.733503100+00:00
updated: 2026-07-23T00:05:00.733503100+00:00
validated: 2026-07-23T00:05:00.733503100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-22): ao enviar o link do PWA para outra pessoa, ela podia entrar diretamente na conta da remetente. CAUSA OBSERVADA NO CÓDIGO: após processar callbacks OAuth/confirmação, `access_token`, `refresh_token` ou `code` permaneciam na URL e podiam ser copiados junto com o link. CORREÇÃO: callbacks web usam PKCE e, depois de processados, removem da barra todos os parâmetros sensíveis via `history.replaceState`, preservando apenas rota e parâmetros comuns. COMO EVITAR: nunca considerar login web concluído enquanto a URL ainda contém credenciais; testar que links comuns permanecem intactos e callbacks perdem tokens/code.
