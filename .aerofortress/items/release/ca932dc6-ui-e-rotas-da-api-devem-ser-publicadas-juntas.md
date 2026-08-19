---
id: ca932dc6-9c63-4a46-9af6-ce7b1f277c91
slug: release
type: scar
title: UI e rotas da API devem ser publicadas juntas
tags: deploy, api, pwa, version-skew, fornecedores, imagens, migration-061, correcao, storage, mutation-real
provenance: dito
evidence: Relato da usuária em 2026-08-19 após deployment af016324; commit 0608c19b; consulta information_schema confirmou as colunas, mas a operação real ainda falha
decay: stable
created: 2026-07-17T14:13:23.534830600+00:00
updated: 2026-08-19T11:39:56.615629400+00:00
validated: 2026-08-19T11:39:56.615629400+00:00
links: 
---

RECORRÊNCIAS: mudanças multiapp chegaram à UI antes da API em Ideias, Campaign Studio, Editar Compra e Fornecedores. Em 2026-08-19, o PWA permitia escolher imagem de fornecedor, mas a API antiga removia `avatarType`, `avatarPresetId` e `avatarUrl`. O backend e a migration 061 foram publicados no commit `0608c19b`; deployment Railway `af016324-62eb-40e6-8b19-10d3b2c8e810` terminou SUCCESS, health respondeu 200 e consulta read-only confirmou no schema de produção `avatar_preset_id`, `avatar_type`, `avatar_url`, `category`, `is_active` e `updated_at`. CORREÇÃO DA USUÁRIA APÓS O DEPLOY: mesmo assim a imagem continuou sem salvar. Portanto, schema presente e deployment SUCCESS NÃO provam o fluxo; ainda é obrigatório capturar a operação autenticada completa (seleção/File → upload no Supabase Storage → URL pública → POST/PATCH → resposta/cache) antes de declarar corrigido. CAUSA ATUAL ainda em diagnóstico; não atribuir novamente à migração sem evidência. PREVENÇÃO: validar uma mutation real e o eco de `avatarUrl/avatarType`, além de conferir bucket/policy/sessão e bundle efetivamente servido.
