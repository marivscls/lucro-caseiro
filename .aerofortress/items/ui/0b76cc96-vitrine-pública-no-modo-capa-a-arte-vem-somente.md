---
id: 0b76cc96-5b48-4f2d-89d1-1f8f53ff5f59
slug: ui
type: scar
title: Vitrine pública: no modo capa, a arte vem somente de coverUrl
tags: catalogo, vitrine-publica, hero, capa, coverUrl, validacao-visual, correcao
provenance: dito
evidence: apps/api/src/features/catalog/storefront-renderer.ts; apps/api/src/features/catalog/storefront-renderer.test.ts; .aerofortress/storefront-cover-final-864x1792.png; .aerofortress/storefront-cover-final-390x844.png
decay: stable
created: 2026-08-19T02:04:49.115355300+00:00
updated: 2026-08-19T02:04:49.115355300+00:00
validated: 2026-08-19T02:04:49.115355300+00:00
links:
---

CORREÇÃO CRÍTICA DA USUÁRIA (2026-08-18): o fundo vinho, curvas, objetos e produtos da referência do hero representam uma única capa enviada em “Personalizar vitrine”; o frontend não deve recriar a arte com blobs, SVGs ou três fotografias. CAUSA OBSERVADA: `renderPublishedStorefrontHtml` ignorava `PublicCatalog.coverUrl` e sempre montava `heroVisuals()` com `.organic` e até três `featuredItems`. CORREÇÃO CANÔNICA: quando `coverUrl` (ou `serviceCoverUrl` no catálogo só de serviços) existir, renderizar uma única imagem em sangria, usar `smallScreenAlternativeUrl` no mobile, aplicar apenas gradiente neutro de legibilidade, manter logo/textos/CTA/quick info independentes e impedir simultaneamente destaques ou decoração. Sem capa, a superfície deve permanecer neutra; falha de carregamento esconde a imagem quebrada e ativa fallback neutro. Validar a rota pública por screenshot real, não apenas a prévia administrativa.
