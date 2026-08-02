---
id: 48263b68-dc62-49ab-a3d4-e02f39e23769
slug: catalog
type: decision
title: Catálogo centraliza curadoria, com compartilhamento separado por seção
tags: catalogo, produtos, servicos, compartilhamento, ui, ux
provenance: dito
evidence: Conversa de 2026-08-01; apps/mobile/src/app/catalog.tsx; apps/mobile/src/features/catalog/api.ts; apps/api/src/features/catalog/catalog.routes.ts; apps/api/src/features/catalog/catalog.domain.ts
decay: stable
created: 2026-08-01T23:29:54.905858700+00:00
updated: 2026-08-02T00:19:59.522953400+00:00
validated: 2026-08-02T00:19:59.522953400+00:00
links:
---

A tela Catálogo online é o lugar canônico para escolher o que aparece na vitrine, visualizar e compartilhar. Ela possui as seções Produtos e Serviços; a tela Serviços permanece operacional (cadastro, preço, duração, agenda, solicitações e pacotes), mantendo apenas o campo “Exibir no catálogo” na edição. A vitrine completa pode reunir produtos e serviços, mas cada ação de compartilhar gera um link próprio: `?tipo=produtos` mostra somente produtos e `?tipo=servicos` mostra somente serviços. A vitrine pública de serviços deve seguir a mesma linguagem visual e anatomia de cards do catálogo de produtos.
