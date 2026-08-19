---
id: 9e064a1f-cb79-4c7a-924c-dc13736761a1
slug: design
type: fact
title: Catálogo mobile usa hero em camadas e card de gestão sobreposto
tags: catalogo, mobile, pwa, responsividade
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; .aerofortress/tmp-cdp-catalog-layout.mjs; capturas .aerofortress/catalog-layout-8083-{320,360,390,430,480,768}-{top,bottom}.png; lint/typecheck/test/build executados em 2026-08-16
decay: stable
created: 2026-08-17T01:04:37.698031700+00:00
updated: 2026-08-17T01:04:37.698031700+00:00
validated: 2026-08-17T01:04:37.698031700+00:00
links:
---

A implementação canônica de Catálogo mobile/PWA em `apps/mobile/src/app/catalog.tsx` usa o asset oficial resolvido por `useBrandIllustration("catalogHero")` em um hero estratificado: wrapper com overflow visível, fundo vinho recortado, conteúdo textual e ilustração absoluta independente. O título é controlado em duas linhas; o card branco de gestão sobrepõe 48 px da base; o hero mede 296–324 px. A validação visual confirmou 55,8–64 px de extravasamento entre 360 e 768 px; em 320 px usa 30 px para manter todos os pixels relevantes do asset visíveis e evitar colisão. Toggles usam trilho rosa, thumb branco e `aria-checked`; o conteúdo móvel reserva 156 px abaixo para navbar/safe area.
