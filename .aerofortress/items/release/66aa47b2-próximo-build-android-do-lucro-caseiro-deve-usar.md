---
id: 66aa47b2-1df9-4819-ae79-0080d57c6da7
slug: release
type: scar
title: Próximo build Android do Lucro Caseiro deve usar versionCode 21
tags: android, eas, release, versionCode, production
provenance: dito
evidence: Correção explícita da usuária em 2026-07-22 após o build a36fc0aa-1c40-45ff-9069-25b567328b34 ter sido iniciado com versionCode 19 e cancelado
decay: stable
created: 2026-07-22T23:36:13.201338700+00:00
updated: 2026-07-22T23:36:13.201338700+00:00
validated: 2026-07-22T23:36:13.201338700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-22): o próximo build Android de produção do Lucro Caseiro deve usar `versionCode 21`, não apenas qualquer número acima do 18. O build EAS `a36fc0aa-1c40-45ff-9069-25b567328b34`, iniciado com 19, foi cancelado. COMO EVITAR: antes de enviar outro `.aab`, confirmar no contexto imediato o versionCode desejado; para este release, validar que Expo config resolve exatamente 21.
