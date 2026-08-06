---
id: 8effa5bd-8cb8-4497-9767-8c1839e3dfe1
slug: backend
type: fact
title: Envio transacional Resend do Lucro Caseiro está operacional
tags:
provenance: observado
evidence: apps/api/src/features/email/grant-professional-trials.ts; apps/api/src/features/email/subscription-lifecycle-email.ts; apps/api/src/features/subscription/subscription.usecases.ts; execução Railway 2026-08-06 16:13Z; 8 IDs Resend; verificação Railway pós-estado; 706 testes API aprovados
decay: seasonal
created: 2026-08-06T13:31:11.407011300+00:00
updated: 2026-08-06T16:21:43.887956100+00:00
validated: 2026-08-06T16:21:43.887956100+00:00
links:
---

Em 2026-08-06, `RESEND_API_KEY` foi configurada no serviço Railway `@lucro-caseiro/api`. O remetente é `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>`, no domínio raiz verificado, e a usuária confirmou no Gmail o recebimento dos testes. O template do presente Profissional usa assets públicos HTTPS em `https://lucrocaseiro.com.br/email/`, sem attachments/CID, e CTA nativo `lucrocaseiro://`. A saudação canônica da campanha é somente `Oi!`, sem interpolar nome. Em 2026-08-06, a campanha com allowlist explícita ativou exatamente 8 contas Free como Profissional de `2026-08-06T16:13:15.823Z` até `2026-09-06T16:13:15.823Z`: Letícia, Ana Carolina, Anndreia, VESTE BELLE, Ana Paula, Fernanda, José e Manoel. A transação retornou as 8 linhas atualizadas, a verificação independente confirmou todas como `professional` e o Resend aceitou os 8 envios com IDs individuais, sem erros. O script `grant-professional-trials.ts` é dry-run por padrão, exige `--confirm-8-users` para mutar/enviar e aceita `--verify-8-users` para leitura pós-estado. Também foram preparados os e-mails idempotentes do ciclo normal: ativação, renovação, pagamento `past_due` e encerramento; eles usam `Oi!`, alternativa texto/HTML, paleta canônica e deep link nativo. As transições são disparadas por `SubscriptionUseCases`, cobrindo Stripe e Google Play; falha de e-mail é best-effort e não reverte o plano confirmado pelo provedor. A chave compartilhada no chat deve ser rotacionada após a finalização dos testes.
