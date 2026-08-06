---
id: 9fe622c6-cfcb-4d6a-990e-3b97664f3211
slug: backend
type: scar
title: Imagens CID do e-mail aparecem como anexos no Gmail
tags:
provenance: dito
evidence: apps/web/public/email/; apps/api/src/features/email/professional-trial-email.ts; captura Gmail da usuária em 2026-08-06
decay: stable
created: 2026-08-06T15:30:54.662187300+00:00
updated: 2026-08-06T15:30:54.662187300+00:00
validated: 2026-08-06T15:30:54.662187300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-06): o template Profissional incorporou cinco PNGs por CID no payload `attachments` do Resend. O Gmail renderizou as imagens no corpo, mas também exibiu cartões de download como `presente-lucro...` e `painel-profissio...`, poluindo o e-mail. CORREÇÃO CANÔNICA: servir os PNGs como assets públicos HTTPS em `https://lucrocaseiro.com.br/email/` e referenciá-los diretamente no HTML; o envio não deve carregar `attachments`. COMO EVITAR: em templates visuais do Lucro Caseiro, validar o e-mail recebido até a área de anexos, não apenas o corpo; CID não é invisível de forma consistente entre clientes.
