---
id: 7b7d499d-5fb5-454a-a0cf-4c224704adb8
slug: arch
type: decision
title: Site público do Lucro Caseiro é um vertical slice isolado em /landing
tags: web, landing, nextjs, arquitetura, lunoa, marketing, seo, calculadora, legal
provenance: observado
evidence: apps/web/src/app/landing; apps/web/src/features/landing; apps/web/src/app/sitemap.ts; apps/web/src/app/robots.ts; packages/contracts/src/pricing-calculator.ts; build Next 20 páginas estáticas; rotas públicas e SEO validados via HTTP em 2026-07-16
decay: stable
created: 2026-07-17T00:36:08.232931600+00:00
updated: 2026-07-17T01:04:59.737090600+00:00
validated: 2026-07-17T01:04:59.737090600+00:00
links:
---

O site público vive dentro de `apps/web` como vertical slice isolado, seguindo o padrão do Lunoa: rotas App Router finas em `src/app/landing`, composição e CSS em `src/features/landing`, contexto em `ai.context.web.md` e assets locais em `public/landing`. A Central de Marketing permanece privada em `/` e `noindex`; o layout de `/landing` sobrescreve essa herança para indexar todas as páginas públicas. O site inclui home, calculadora local de preço, privacidade, termos, exclusão de conta, suporte e três guias de precificação, além de sitemap, robots, canonical, JSON-LD e Google Analytics opcional por `NEXT_PUBLIC_GA_ID`. A calculadora não envia nem salva dados e usa as mesmas fórmulas canônicas de mobile e API, agora centralizadas em `packages/contracts/src/pricing-calculator.ts`. A narrativa principal é precificação → produto → catálogo ou venda, com CTA para o aplicativo Android oficial.
