---
id: 2bb4d9ca-5352-4e78-b7f4-13c970658f84
slug: analytics
type: fact
title: Uso real da coorte do mês Profissional em 2026-08-15
tags: uso, produção, campanha, trial, atividade, analytics, retenção, email
provenance: observado
evidence: Consultas read-only no banco de produção e Resend API via Railway @lucro-caseiro/api em 2026-08-15T16Z; apps/api/src/features/email/professional-trial-email.ts; Railway HTTP logs --since 7d
decay: volatile
created: 2026-08-15T16:22:57.884830800+00:00
updated: 2026-08-15T16:28:10.334502800+00:00
validated: 2026-08-15T16:28:10.334502800+00:00
links:
---

Snapshot de produção em 2026-08-15 após o encerramento da campanha `professional-first-100-2026`: os 18 beneficiários continuavam com Profissional ativo. Apenas 6/18 voltaram em um dia posterior à concessão (1/3 dos que ganharam no signup, 2/7 dos automáticos concedidos depois e 3/8 da coorte manual). Nove chegaram a telas centrais do produto, mas somente 4 gravaram dados reais após o presente, somando 36 registros: 15 vendas por 2 usuários, 11 lançamentos financeiros por 2, 8 clientes por 1 e 2 produtos por 2. Os 18 e-mails foram marcados como enviados sem erro no banco; só 10 possuem message ID e a chave Resend de Sending access não autoriza consultar entrega/abertura/clique (API respondeu 401), portanto envio aceito não prova leitura. O CTA do e-mail usa apenas `lucrocaseiro://`; três beneficiários têm instalações web vinculadas, então o link não é universal. No app como um todo, excluindo as duas contas `marivscls` e domínios internos/teste, 14/24 contas ficaram ativas em 7 dias e 5 criaram 33 registros de negócio; em 30 dias, 23 ficaram ativas e 11 criaram 112 registros. Os logs HTTP não mostraram erros 5xx nos 7 dias consultados; 404 das rotas Verticais e 400 de Embalagens vieram de uma única origem, sem sinal de falha sistêmica entre usuários. O funil de analytics subconta ativação (`activated_users_total=0`) apesar dos registros reais, então não deve ser usado sozinho.
