---
id: ca932dc6-9c63-4a46-9af6-ce7b1f277c91
slug: release
type: scar
title: UI e rotas da API devem ser publicadas juntas
tags: deploy, api, pwa, version-skew, compatibilidade, compras, marketing
provenance: observado
evidence: apps/mobile/.env aponta para https://lucro-caseiroapi-production.up.railway.app; packages/contracts/src/schemas/purchase.ts; apps/api/src/features/purchases/purchases.routes.ts; apps/mobile/src/features/purchases/api.ts; relato da usuária em 2026-07-19; alterações do endpoint ainda locais e não publicadas
decay: stable
created: 2026-07-17T14:13:23.534830600+00:00
updated: 2026-07-19T23:37:17.444279200+00:00
validated: 2026-07-19T23:37:17.444279200+00:00
links:
---

RECORRÊNCIAS: (1) em 2026-07-17, o botão “Gerar Ideias” apareceu na web local enquanto a API de produção ainda não tinha `POST /ai/content/ideas`; (2) em 2026-07-18, o Campaign Studio novo passou a enviar Público e Oferta vazios, mas a API Railway anterior ainda exigia `.min(2)`, resultando em HTTP 400; (3) em 2026-07-19, a ação Editar Compra apareceu no PWA local, que apontava para a API de produção, mas o novo `PATCH /api/v1/purchases/:id` só existia no worktree local, resultando em “Erro desconhecido”. CAUSA: version skew entre UI, contratos e API numa alteração multiapp. CORREÇÃO: publicar e validar UI/contrato/API como um corte compatível; durante rollout, o cliente novo deve tolerar a API anterior apenas quando isso for simples e seguro. Para edição financeira/estoque, não usar fallback de excluir e recriar. Após deploy, confirmar health, bundle e uma chamada real autenticada do endpoint; não aceitar GET cacheado ou build local como prova.
