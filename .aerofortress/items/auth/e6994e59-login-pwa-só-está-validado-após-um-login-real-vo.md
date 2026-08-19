---
id: e6994e59-3c64-46e9-8aed-ecbe219a6190
slug: auth
type: scar
title: Login PWA só está validado após um login real voltar autenticado
tags: oauth, google, email, senha, pwa, validacao, correcao-usuario, redirect, sessao
provenance: dito
evidence: Correção explícita da usuária em 2026-08-14; probe local em http://127.0.0.1:8088: senha de teste recebeu 400 invalid_credentials e Google chegou ao seletor com redirect_to http://127.0.0.1:8088/, sem login humano completo.
decay: stable
created: 2026-07-17T01:42:26.235945700+00:00
updated: 2026-08-14T19:45:50.603833+00:00
validated: 2026-08-14T19:45:50.603833+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-16 e novamente 2026-07-18): ajustes estruturais e builds verdes não provaram que o Google conectava. Em 2026-07-18, depois de corrigir a tela vazia do boot e confirmar que o bundle usa redirect web direto (`skipBrowserRedirect: false`), a usuária mostrou o seletor de contas do Google e informou que, ao escolher o e-mail, o fluxo continuava tentando conectar sem devolver uma sessão ao app.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-14): após recompilar o PWA Lucro na Obra e validar apenas que `/login` renderizava sem erros no console, foi dito que o app estava funcional; a usuária corrigiu que não estava logando. Um probe posterior provou apenas que e-mail/senha alcança o Supabase e que o botão Google chega ao seletor de contas. Isso ainda não prova retorno autenticado.

LIÇÃO: nunca declarar autenticação PWA funcionando antes de observar o fluxo completo — envio → provedor/Supabase → callback → retorno à origem permitida → sessão aplicada → rota autenticada. Para e-mail/senha, credencial inválida prova conectividade, não sucesso. Para Google, chegar ao seletor de contas prova somente o início. Enquanto credenciais humanas ou configuração remota impedirem o teste completo, relatar explicitamente como não verificado. Diagnosticar nesta ordem: capturar método e mensagem real; confirmar a conta/identidade (Google versus senha); capturar a URL/erro após a escolha; confirmar Redirect URLs; validar processamento de code/tokens e sessão.
