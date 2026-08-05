---
id: 1a2f3904-eb26-4cd9-89d0-53c24b880a5c
slug: releases
type: fact
title: Catálogo com links separados de produtos e serviços publicado
tags: release, catalogo, produtos, servicos, railway, producao
provenance: observado
evidence: commit 240b364cd55919612f112c0059f5fbaaecc09fd7; Railway deployments ac4055a3-915e-40d3-b03b-86b408850941 e 5c862084-e6e6-484e-8bbf-a24efea512d8; https://catalogo.lucrocaseiro.com.br/c/papelaria?tipo=servicos; https://app.lucrocaseiro.com.br
decay: stable
created: 2026-08-02T00:40:07.265196+00:00
updated: 2026-08-02T00:40:07.265196+00:00
validated: 2026-08-02T00:40:07.265196+00:00
links:
---

Em 2026-08-01/02, o catálogo centralizado foi publicado em produção no commit `240b364`. A ação de produtos gera `?tipo=produtos` e a de serviços gera `?tipo=servicos`; a API filtra o HTML no servidor, o catálogo completo mantém navegação entre as seções, o card público de serviço usa a anatomia visual de produtos e o formulário abre pelo topo. A migração `046_product_catalog_visibility.sql` foi aplicada antes do rollout. Railway confirmou SUCCESS para `@lucro-caseiro/api` e `@lucro-caseiro/mobile` no mesmo commit; health e páginas públicas responderam HTTP 200.
