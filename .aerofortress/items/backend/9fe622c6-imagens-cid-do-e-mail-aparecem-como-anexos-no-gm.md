---
id: 9fe622c6-cfcb-4d6a-990e-3b97664f3211
slug: backend
type: scar
title: Imagens CID do e-mail aparecem como anexos no Gmail
tags:
provenance: dito
evidence: apps/web/public/email/; apps/api/src/features/email/professional-trial-email.ts; apps/api/src/features/email/send-test-email.ts; capturas Gmail da usuária em 2026-08-06
decay: stable
created: 2026-08-06T15:30:54.662187300+00:00
updated: 2026-08-06T15:43:11.709027100+00:00
validated: 2026-08-06T15:43:11.709027100+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-06): o template Profissional incorporou cinco PNGs por CID no payload `attachments` do Resend. O Gmail renderizou as imagens no corpo, mas também exibiu cartões de download como `presente-lucro...` e `painel-profissio...`, poluindo o e-mail. CORREÇÃO CANÔNICA: servir os PNGs como assets públicos HTTPS em `https://lucrocaseiro.com.br/email/` e referenciá-los diretamente no HTML; o envio não deve carregar `attachments`. ARMADILHA DE VALIDAÇÃO: o Gmail agrupa mensagens com o mesmo assunto e pode continuar mostrando, no resumo da conversa, anexos pertencentes a testes antigos mesmo quando o envio novo não tem attachments. Para validar a correção, enviar a prévia sem attachments com um assunto claramente diferente, abrindo uma conversa isolada. COMO EVITAR: em templates visuais do Lucro Caseiro, validar o e-mail recebido até a área de anexos e em uma thread limpa, não apenas o corpo; CID não é invisível de forma consistente entre clientes.
