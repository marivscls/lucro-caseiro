---
id: 4d847ad8-0e26-4f12-9082-9672e83735bd
slug: design
type: decision
title: Catálogo com domínio próprio: catalogo.lucrocaseiro.com.br (EXPO_PUBLIC_CATALOG_URL no eas.json)
tags: 
provenance: observado
evidence: apps/mobile/eas.json (EXPO_PUBLIC_CATALOG_URL nos 3 perfis, commit 9b6dbc5); apps/mobile/src/features/catalog/api.ts (publicCatalogUrl lê EXPO_PUBLIC_CATALOG_URL ?? EXPO_PUBLIC_API_URL); apps/api/src/features/catalog/catalog.domain.ts
decay: stable
created: 2026-06-26T12:41:17.061402100+00:00
updated: 2026-06-26T12:41:17.061402100+00:00
validated: 2026-06-26T12:41:17.061402100+00:00
links: 
---

Domínio **lucrocaseiro.com.br** é da usuária. O link do catálogo agora aponta pra **https://catalogo.lucrocaseiro.com.br** via `EXPO_PUBLIC_CATALOG_URL` (setado nos 3 perfis do eas.json; só vale em build novo, é var de build). `publicCatalogUrl(slug)` = `${EXPO_PUBLIC_CATALOG_URL ?? EXPO_PUBLIC_API_URL}/c/${slug}`. O slug já era editável em Catálogo→endereço (ex.: mariana-vasconcelos). DNS pendente: no Railway (serviço da API) foi adicionado Custom Domain `catalogo.lucrocaseiro.com.br`, que pediu **CNAME `catalogo` → kf98vpqd.up.railway.app** + **TXT `_railway-verify.catalogo` → railway-verify=8a8fbd8e...**. Até o DNS propagar e o domínio ficar Active no Railway, links de catálogo desse build NÃO resolvem. Botão "Pedir/Fazer pedido no WhatsApp" no catálogo só aparece se houver WhatsApp em Catálogo→"WhatsApp para pedidos" (fallback: telefone do perfil). Subdomínio-por-loja (`<slug>.lucrocaseiro.com.br`, estilo concorrente) ficou como evolução futura (exige wildcard DNS + roteamento por host).
