---
id: 6962e9a0-d3be-4b19-8c0b-0a5f7023140a
slug: arch
type: decision
title: Lucro Caseiro deixa de ser dono da Central de Marketing
tags: selenita, marketing, migration, tenant, tauri, flavor
provenance: dito
evidence: Decisões da usuária em 2026-07-17 e 2026-08-09; implementação canônica em C:/Users/maria/Documents/projects/selenita/docs/prd-adr-lucro-caseiro-desktop-edition.md
decay: stable
created: 2026-07-17T14:28:13.854219600+00:00
updated: 2026-08-09T15:15:04.040738100+00:00
validated: 2026-08-09T15:15:04.040738100+00:00
links:
---

Todas as funcionalidades genéricas da Central de Marketing pertencem ao Selenita, que continua sendo sua fonte canônica. O Lucro Caseiro pode ter uma distribuição desktop própria — “Central de Marketing — Lucro Caseiro” — desde que seja um flavor oficial do Selenita, compartilhando core, API, UI e Engine, e não um fork mantido neste repositório. A edição dedicada isola identidade, instalador, keyring e banco local, e provisiona o workspace/conteúdo Lucro Caseiro; o Lucro Caseiro também continua suportado como workspace do Selenita SaaS.
