---
id: 5c1dd1d3-cc79-4dfc-b67a-026ce4d79130
slug: build
type: fact
title: Conta EAS canônica do Lucro Caseiro é marivscls
tags: eas, android, marivscls, migracao, keystore, play-store, upload-key
provenance: observado
evidence: apps/mobile/app.config.ts; apps/mobile/app.json; packages/brands/src/lucro-caseiro/brand.json; apps/mobile/.maestro/README.md; EAS build https://expo.dev/accounts/marivscls/projects/lucro-caseiro/builds/957e72cb-8370-418f-82ee-638c905949d7; Play Console exibiu solicitação pendente em 2026-07-20
decay: seasonal
created: 2026-07-20T12:42:59.380246700+00:00
updated: 2026-07-20T15:04:54.691309500+00:00
validated: 2026-07-20T15:04:54.691309500+00:00
links:
---

Em 2026-07-20, a usuária definiu `marivscls` (marianadosreisvasconcelos7@gmail.com) como conta EAS canônica. O projeto é @marivscls/lucro-caseiro, projectId a64ae465-7911-4d82-81a3-9f2d20973dff, package br.com.orionseven.lucrocaseiro e keystore padrão Build Credentials 4ippGO6_xI, SHA-256 F8:7B:A1:CE:EB:38:53:25:35:D8:3E:F1:66:6F:0A:C5:C4:B8:5B:DE:A6:72:AD:0D:67:08:E6:AB:1F:97:FF:D9. O repositório foi atualizado em app.config.ts, app.json, brand.json e README do Maestro. A Play Console recebeu uma solicitação de redefinição da upload key antiga EE:D7:... para essa nova chave; enquanto estiver pendente, builds development são válidos, mas produção não deve ser enviada. O build development 957e72cb-8370-418f-82ee-638c905949d7 foi aceito e entrou na fila usando o novo keystore.
