---
id: 4d847ad8-0e26-4f12-9082-9672e83735bd
slug: design
type: decision
title: Catálogo com domínio próprio: catalogo.lucrocaseiro.com.br (ATIVO; env em eas.json e .env local)
tags: 
provenance: observado
evidence: apps/mobile/eas.json (3 perfis); apps/mobile/.env (linha adicionada 2026-07-11); apps/mobile/src/features/catalog/api.ts; HTTP 200 em https://catalogo.lucrocaseiro.com.br/c/mariana-vasconcelos
decay: stable
created: 2026-06-26T12:41:17.061402100+00:00
updated: 2026-07-11T19:58:27.856000300+00:00
validated: 2026-07-11T19:58:27.856000300+00:00
links: 
---

Domínio **lucrocaseiro.com.br** é da usuária. Link do catálogo = **https://catalogo.lucrocaseiro.com.br/c/&lt;slug&gt;** via `EXPO_PUBLIC_CATALOG_URL`. `publicCatalogUrl(slug)` = `${EXPO_PUBLIC_CATALOG_URL ?? EXPO_PUBLIC_API_URL}/c/${slug}`. DNS **ATIVO desde 2026-07-11** (CNAME catalogo → kf98vpqd.up.railway.app; HTTP 200 verificado). A var está nos 3 perfis do eas.json (builds) E no `apps/mobile/.env` local (adicionada 2026-07-11 — antes faltava, e o dev build via Metro caía no fallback do Railway, gerando link feio ao compartilhar). Var de build: mudança no .env exige reiniciar o Metro; mudança no eas.json exige build novo. Botão "Pedir no WhatsApp" no catálogo só aparece se houver WhatsApp em Catálogo→"WhatsApp para pedidos" (fallback: telefone do perfil). Subdomínio-por-loja (`<slug>.lucrocaseiro.com.br`) segue como evolução futura.
