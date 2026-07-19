---
id: e6994e59-3c64-46e9-8aed-ecbe219a6190
slug: auth
type: scar
title: OAuth Google no PWA só está corrigido após um login real voltar autenticado
tags: oauth, google, pwa, validacao, correcao-usuario, redirect
provenance: dito
evidence: Relatos e screenshots da usuária em 2026-07-16 e 2026-07-18; em 2026-07-18 o Google chegou a “Escolha uma conta — Prosseguir para ujwxvpceqigvyxcqolch.supabase.co”, mas ficou tentando conectar após selecionar o e-mail.
decay: stable
created: 2026-07-17T01:42:26.235945700+00:00
updated: 2026-07-18T22:41:40.874844400+00:00
validated: 2026-07-18T22:41:40.874844400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-16 e novamente 2026-07-18): ajustes estruturais e builds verdes não provaram que o Google conectava. Em 2026-07-18, depois de corrigir a tela vazia do boot e confirmar que o bundle usa redirect web direto (`skipBrowserRedirect: false`), a usuária mostrou o seletor de contas do Google para o projeto Supabase e informou que, ao escolher o e-mail, o fluxo continua tentando conectar sem devolver uma sessão ao app. LIÇÃO: nunca declarar OAuth PWA corrigido antes de observar o fluxo completo — clique → Google → escolha da conta → callback do Supabase → retorno à origem permitida → sessão aplicada → app autenticado. Enquanto credenciais humanas ou a configuração remota impedirem o teste completo, relatar explicitamente como não verificado. Diagnosticar nesta ordem: capturar a URL/erro real depois da escolha; confirmar a origem exata em Authentication → URL Configuration → Redirect URLs; então validar o processamento dos tokens/code no retorno.
