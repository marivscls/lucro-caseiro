---
id: 633813bb-ad58-4f47-8671-7e0b8e60676f
slug: build
type: scar
title: Imports de imagens da Home devem respeitar que onboarding assets ficam em src/assets
tags: metro, android, assets, onboarding
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx; bundle Android Metro respondeu 200 com 17.512.172 bytes em 2026-08-13
decay: stable
created: 2026-08-13T23:55:22.205990200+00:00
updated: 2026-08-13T23:55:22.205990200+00:00
validated: 2026-08-13T23:55:22.205990200+00:00
links:
---

SINTOMA (2026-08-13): o development build Android abriu `UnableToResolveError` depois de adicionar o mock de onboarding na Home. CAUSA: `apps/mobile/src/app/tabs/index.tsx` importou as ilustrações via `../../../assets`, apontando para `apps/mobile/assets`, mas elas pertencem a `apps/mobile/src/assets`. CORREÇÃO: a partir de `src/app/tabs`, usar `../../assets/...`. COMO EVITAR: antes de entregar um novo import de asset, confirmar o caminho físico e solicitar o bundle Android real do manifesto Expo; lint e TypeScript não detectam asset ausente.
