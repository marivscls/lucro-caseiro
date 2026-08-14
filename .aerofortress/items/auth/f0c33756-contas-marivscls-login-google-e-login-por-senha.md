---
id: f0c33756-64c6-406a-9dac-6228f6cc4ac8
slug: auth
type: fact
title: Contas marivscls: login Google e login por senha estão em e-mails diferentes
tags: login, email, password, google, supabase, mobile
provenance: observado
evidence: Consulta read-only em produção a auth.users/auth.identities via DATABASE_URL do serviço Railway @lucro-caseiro/api; Supabase /auth/v1/settings e /auth/v1/token responderam normalmente; bundle Android Metro na porta 8083 contém URL e chave reais do Supabase.
decay: volatile
created: 2026-08-13T18:45:00.910303900+00:00
updated: 2026-08-13T18:45:00.910303900+00:00
validated: 2026-08-13T18:45:00.910303900+00:00
links:
---

Em 2026-08-13, o Supabase Auth confirmou duas contas distintas. `marivscls@gmail.com` está confirmada, tem apenas identidade Google e não possui senha; `marivscls@gmail.comm` (dois “m”) está confirmada, tem identidade e senha de e-mail e foi a conta usada no aparelho naquele dia. Portanto, tentar senha na conta `.com` retorna credenciais inválidas até a proprietária usar o fluxo de recuperação para criar uma senha; a conta `.comm` contém um erro de digitação e não deve virar a identidade canônica.
