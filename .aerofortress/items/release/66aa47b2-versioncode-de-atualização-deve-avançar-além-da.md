---
id: 66aa47b2-1df9-4819-ae79-0080d57c6da7
slug: release
type: scar
title: VersionCode de atualização deve avançar além da versão já gerada
tags: android, eas, release, versionCode, production, play-store
provenance: dito
evidence: EAS build:list e build:view em 2026-08-04; apps/mobile/app.config.ts; apps/mobile/app.json
decay: stable
created: 2026-07-22T23:36:13.201338700+00:00
updated: 2026-08-05T02:26:33.687091400+00:00
validated: 2026-08-05T02:26:33.687091400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-03): uma atualização Android nunca pode reutilizar o `versionCode` de um artefato de produção anterior. O 22 foi gerado com sucesso no EAS em 2026-08-03 (build `aaa8ef84-350f-4ee4-a020-6de747cbc1d1`); por isso, em 2026-08-04 o próximo build de produção foi corretamente configurado e iniciado como 23 (`3eff1b24-51ba-44db-8bc7-48376a698f04`). COMO EVITAR: antes de cada build de produção, consultar o histórico real do EAS/Play Console e usar um `versionCode` estritamente maior; não confiar em uma memória antiga de “próximo número”.
