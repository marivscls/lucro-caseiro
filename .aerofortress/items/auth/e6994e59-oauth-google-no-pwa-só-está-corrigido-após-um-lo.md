---
id: e6994e59-3c64-46e9-8aed-ecbe219a6190
slug: auth
type: scar
title: OAuth Google no PWA só está corrigido após um login real voltar autenticado
tags: oauth, google, pwa, validacao, correcao-usuario
provenance: dito
evidence: Relato da usuária nesta conversa em 2026-07-16: “ainda nao ta conectando com o google” após a primeira correção.
decay: stable
created: 2026-07-17T01:42:26.235945700+00:00
updated: 2026-07-17T01:42:26.235945700+00:00
validated: 2026-07-17T01:42:26.235945700+00:00
links: 
---

CORREÇÃO DA USUÁRIA (2026-07-16): após ajustar o redirect web para a origem, chamar `maybeCompleteAuthSession()` e separar loaders, o Google ainda não conectou. A primeira entrega tinha build, testes, servidor e renderização do bundle verdes, mas não havia concluído um login Google real. LIÇÃO: não declarar OAuth PWA corrigido com testes estruturais; é obrigatório observar o fluxo completo — clique → Google → callback permitido pelo Supabase → sessão aplicada → app autenticado. Enquanto credenciais humanas impedirem completar o login, relatar explicitamente como não verificado e capturar ao menos a URL/erro de redirecionamento real no navegador.
