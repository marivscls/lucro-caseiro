---
id: 2ea34c29-e1b4-42c2-a79a-1c7dbaa30d26
slug: backend
type: fact
title: Resend de produção usa contato@orionseven.com.br como Reply-To
tags: resend, email, reply-to, feedback, produção, orionseven
provenance: observado
evidence: Railway production @lucro-caseiro/api em 2026-08-15: EMAIL_REPLY_TO=contato@orionseven.com.br confirmado via railway run
decay: stable
created: 2026-08-15T16:45:10.596604300+00:00
updated: 2026-08-15T16:50:23.182488900+00:00
validated: 2026-08-15T16:50:23.182488900+00:00
links:
---

Em 2026-08-15, `EMAIL_REPLY_TO=contato@orionseven.com.br` foi salvo no ambiente production do serviço Railway `@lucro-caseiro/api`. O remetente continua sendo o domínio verificado `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>`; somente as respostas são direcionadas à caixa da Orion Seven. A variável foi configurada com `--skip-deploys`, portanto `railway run` e próximos deploys já a recebem, enquanto o processo atualmente em execução só passará a usá-la após o próximo deploy. Os 5 e-mails enviados antes dessa correção permanecem com Reply-To no Gmail da usuária, pois cabeçalhos já enviados não podem ser alterados.
