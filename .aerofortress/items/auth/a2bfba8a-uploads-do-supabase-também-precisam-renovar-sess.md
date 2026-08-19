---
id: a2bfba8a-e520-4433-b7fa-0eb6a605db53
slug: auth
type: scar
title: Uploads do Supabase também precisam renovar sessão expirada no PWA
tags: pwa, supabase, storage, upload, token-refresh, catalogo
provenance: observado
evidence: Railway HTTP logs de 2026-08-17 mostraram PUT /api/v1/catalog/settings 200 e nenhuma falha do endpoint; apps/mobile/src/shared/utils/upload-image.ts; apps/mobile/src/shared/utils/upload-image.test.ts; 10 testes focados, ESLint, typecheck mobile e build:pwa:caseiro passaram em 2026-08-16
decay: stable
created: 2026-08-17T03:00:39.668906+00:00
updated: 2026-08-17T03:01:58.974825200+00:00
validated: 2026-08-17T03:01:58.974825200+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): o personalizador do Catálogo podia mostrar “Não foi possível salvar” antes de qualquer PUT chegar à API. Os logs do Railway confirmaram PUTs anteriores com 200 e nenhuma falha de `/catalog/settings`; o caminho novo enviava logo/capa ao Supabase Storage antes da API, mas `upload-image.ts` apenas lia `getSession()` e não renovava access token expirado, apesar de `apiClient` já possuir essa defesa. CORREÇÃO: antes do upload, renovar sessões vencidas ou a menos de 60 s do vencimento; se o Storage responder 401, renovar e repetir exatamente uma vez; manter mensagens amigáveis e o rascunho na tela. COMO EVITAR: todo cliente autenticado externo (API e Storage) deve cobrir o primeiro uso após o PWA ficar inativo, com teste que prova token expirado e retry 401.
