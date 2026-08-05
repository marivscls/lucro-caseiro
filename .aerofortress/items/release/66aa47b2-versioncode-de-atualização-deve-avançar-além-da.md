---
id: 66aa47b2-1df9-4819-ae79-0080d57c6da7
slug: release
type: scar
title: VersionCode de atualização deve avançar além da versão já publicada
tags: android, eas, release, versionCode, production, play-store
provenance: dito
evidence: Correção explícita da usuária em 2026-08-03 após a build EAS 5a99fb63-0e16-4f75-8c69-ca65be6e5434 ter sido concluída com versionCode 21
decay: stable
created: 2026-07-22T23:36:13.201338700+00:00
updated: 2026-08-04T01:58:28.114436700+00:00
validated: 2026-08-04T01:58:28.114436700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-03): o build Android de produção recém-gerado com `versionCode 21` não serve para esta atualização porque a versão anterior publicada já usa 21; a nova build deve usar exatamente `versionCode 22`. A memória anterior dizia que o “próximo build” deveria ser 21, mas esse requisito já havia sido consumido pela publicação anterior. COMO EVITAR: antes de cada build de produção, confirmar qual versionCode já está publicado ou foi usado no Play Console e resolver no Expo config exatamente o próximo código solicitado; nunca tratar uma instrução antiga de “próximo build” como permanente.
