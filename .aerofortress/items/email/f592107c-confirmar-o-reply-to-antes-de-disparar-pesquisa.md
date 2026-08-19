---
id: f592107c-424d-4234-a3d4-5c44e1ed096d
slug: email
type: scar
title: Confirmar o Reply-To antes de disparar pesquisa aos usuários
tags: resend, reply-to, pesquisa, feedback, correção
provenance: dito
evidence: Correção da usuária em 2026-08-15; Railway @lucro-caseiro/api EMAIL_REPLY_TO
decay: stable
created: 2026-08-15T16:50:23.233773600+00:00
updated: 2026-08-15T16:50:23.233773600+00:00
validated: 2026-08-15T16:50:23.233773600+00:00
links:
---

SINTOMA (2026-08-15): 5 e-mails de pesquisa foram enviados com `Reply-To` apontando para o Gmail usado no teste porque `EMAIL_REPLY_TO` estava vazio e o agente inferiu esse endereço sem confirmar a caixa operacional. CORREÇÃO DA USUÁRIA: respostas de pesquisas do Lucro Caseiro devem ir para `contato@orionseven.com.br`. CORREÇÃO APLICADA: salvar essa caixa como `EMAIL_REPLY_TO` no serviço Railway da API; manter o remetente verificado `notificacoes@lucrocaseiro.com.br`. COMO EVITAR: antes de qualquer disparo externo que peça resposta, verificar explicitamente o Reply-To operacional; endereço de teste/recipient não implica endereço de atendimento.
