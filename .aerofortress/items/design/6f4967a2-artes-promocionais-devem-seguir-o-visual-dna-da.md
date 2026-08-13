---
id: 6f4967a2-ffa8-4d41-8084-240a174b54c3
slug: design
type: scar
title: Artes promocionais devem seguir o Visual DNA da Central de Marketing
tags: marketing, play-store, identidade-visual, central-de-marketing, tipografia, screenshots
provenance: dito
evidence: Correções da usuária em 2026-07-23 e 2026-08-11; apps/api/src/features/marketing/marketing.system-prompt.ts; apps/promo-video/src/FeatureGraphics.tsx; apps/promo-video/src/PlayStoreVideo.tsx; apps/promo-video/src/StoreScreenshots.tsx
decay: stable
created: 2026-07-23T13:24:26.680209500+00:00
updated: 2026-08-11T23:59:34.266160400+00:00
validated: 2026-08-11T23:59:34.266160400+00:00
links:
---

CORREÇÃO DA USUÁRIA (atualizada em 2026-08-11): as artes promocionais do Lucro Caseiro não podem usar uma branding paralela à Central de Marketing nem ser atualizadas parcialmente. SINTOMAS: primeiro o recurso gráfico e o vídeo ainda usavam Fraunces como fonte dominante, rosa decorativo, cápsulas e grafismos circulares; depois, ao corrigir somente parte dos arquivos, ficaram de fora as 8 artes de telefone, as 8 artes de tablet e duas variações antigas do recurso gráfico (pessoa e interface). CORREÇÃO: off-white #FAF8F6 e vinho #4A2332 estruturam a composição; rosa #B65F72 fica em no máximo 15–20%; lima #DCE86A aparece em um único gesto; Nunito Sans 700/800 domina; Fraunces acentua no máximo uma palavra. Interfaces reais e fotografia carregam o foco, com amplo respiro e sem ornamento de preenchimento. O escopo de uma troca de branding da Play Store inclui todas as variações do recurso gráfico, vídeo, screenshots de telefone e screenshots de tablet 7″/10″. COMO EVITAR: antes de concluir, inventariar todos os entregáveis e variantes da ficha, ler `VISUAL_ART_DIRECTION_GUARDRAIL`, reutilizar `marketing-brand.ts` e validar visualmente uma amostra de cada formato.
