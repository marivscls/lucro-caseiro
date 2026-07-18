---
id: 73309cf4-87f1-49d5-ba77-0f60a408700b
slug: seo
type: scar
title: Next Metadata: noindex da raiz privada é herdado pelas páginas públicas
tags: nextjs, metadata, robots, seo, landing, pwa
provenance: observado
evidence: apps/web/src/app/layout.tsx; apps/web/src/app/landing/layout.tsx; apps/web/src/app/robots.ts; apps/web/src/app/sitemap.ts
decay: stable
created: 2026-07-17T01:00:55.700827800+00:00
updated: 2026-07-17T01:00:55.700827800+00:00
validated: 2026-07-17T01:00:55.700827800+00:00
links: 
---

SINTOMA (2026-07-16): as novas páginas públicas tinham canonical, sitemap e robots.txt corretos, mas apenas `/landing` sobrescrevia `robots`; privacidade, calculadora, suporte e guias herdariam `noindex` do layout raiz da Central de Marketing. CAUSA: metadados do App Router são herdados por layouts aninhados. CORREÇÃO: declarar `robots: { index: true, follow: true }` no layout `/landing`, mantendo o noindex raiz para o PWA privado. COMO EVITAR: quando um mesmo Next app mistura área privada e site público, validar meta robots por segmento, não apenas robots.txt e sitemap.
