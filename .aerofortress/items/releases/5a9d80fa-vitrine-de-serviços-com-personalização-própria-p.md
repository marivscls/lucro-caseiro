---
id: 5a9d80fa-1723-46af-8638-4cb1ea3ae9cc
slug: releases
type: fact
title: Vitrine de Serviços com personalização própria publicada
tags: produção, catálogo, serviços, personalização
provenance: observado
evidence: commit c740687488fd758b6875fe3917247095bb912a57; Railway deploys de2d8712-9c85-4479-a8e1-9bcfb1b87630 e 6606a02b-eaca-4e11-8719-15b56d98b063; apps/mobile/src/app/catalog.tsx; packages/database/src/migrations/047_catalog_service_customization.sql
decay: seasonal
created: 2026-08-02T01:27:47.909246200+00:00
updated: 2026-08-02T01:27:47.909246200+00:00
validated: 2026-08-02T01:27:47.909246200+00:00
links:
---

Em 2026-08-01/02, foi publicada em produção a personalização independente da vitrine de Serviços no commit `c740687488fd758b6875fe3917247095bb912a57`. Serviços agora possui capa, frase de apresentação e faixa promocional próprias; foto/logo, WhatsApp, cor e estampa continuam compartilhados com Produtos. A migração `047_catalog_service_customization.sql` foi aplicada antes do deploy e preservou a apresentação existente como valor inicial. Os deploys Railway da API (`de2d8712-9c85-4479-a8e1-9bcfb1b87630`) e do PWA (`6606a02b-eaca-4e11-8719-15b56d98b063`) terminaram em SUCCESS. Em produção, health, `/c/papelaria?tipo=servicos` e PWA responderam HTTP 200; o bundle servido contém `serviceCoverUrl`, `serviceTagline`, `servicePromoBanner` e o seletor de aparência.
