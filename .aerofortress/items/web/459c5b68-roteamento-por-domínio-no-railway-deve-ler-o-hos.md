---
id: 459c5b68-c805-4916-ba8d-e51913b3aa57
slug: web
type: scar
title: Roteamento por domínio no Railway deve ler o host encaminhado
tags:
provenance: observado
evidence: apps/web/src/proxy.ts; apps/web/src/proxy.test.ts; deploy Railway 4e006ac9-fd8f-414e-893d-e29d61083507; prova HTTP em https://lucrocaseiro.com.br/ em 2026-08-09
decay: stable
created: 2026-08-09T15:13:55.926983900+00:00
updated: 2026-08-09T15:13:55.926983900+00:00
validated: 2026-08-09T15:13:55.926983900+00:00
links:
---

BUG CORRIGIDO (2026-08-09): o proxy Next.js tentou distinguir `lucrocaseiro.com.br` pela propriedade `request.nextUrl.hostname`, mas em produção no Railway a raiz continuou montando a Central de Marketing. A prova HTTP do deployment verde mostrou `<title>Central de Marketing</title>`. PREVENÇÃO: em roteamento por domínio atrás do Railway, resolver primeiro `x-forwarded-host`, depois `host`, e usar `nextUrl.hostname` apenas como fallback; remover porta e cobrir domínio público, subdomínio interno e localhost com teste.
