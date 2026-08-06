---
id: 8effa5bd-8cb8-4497-9767-8c1839e3dfe1
slug: backend
type: fact
title: Envio transacional Resend do Lucro Caseiro está operacional
tags:
provenance: observado
evidence: apps/api/src/features/email/professional-trial-email.ts; apps/api/src/features/email/send-test-email.ts; apps/web/public/email/; Railway deploy ffd55dcc-deba-478c-ba7e-8a4ccaf99c9e; Resend id 5a5d6cec-c9b4-435d-baa8-4b173903c486
decay: seasonal
created: 2026-08-06T13:31:11.407011300+00:00
updated: 2026-08-06T15:43:27.636967+00:00
validated: 2026-08-06T15:43:27.636967+00:00
links:
---

Em 2026-08-06, `RESEND_API_KEY` foi configurada no serviço Railway `@lucro-caseiro/api` sem redeploy. O remetente é `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>`, no domínio raiz verificado, e a usuária confirmou no Gmail o recebimento dos testes. O template final do presente Profissional reproduz a referência aprovada: hero rosa com presente 3D, chamada `Lucro Caseiro é parceria que gera resultados`, painel financeiro, faixa de quatro benefícios, CTA `Explorar meu plano` e rodapé. Para não aparecerem como anexos no Gmail, os cinco PNGs são servidos por HTTPS em `https://lucrocaseiro.com.br/email/` e não são enviados como attachments/CID; todos responderam HTTP 200 com `image/png` após o deploy Railway `ffd55dcc-deba-478c-ba7e-8a4ccaf99c9e`. O selo usa o pequeno presente 3D, e os blocos usam estrela e coração fornecidos, ambos em 46×46 px. O CTA aponta para o esquema nativo existente `lucrocaseiro://`. O Gmail agrupou as versões anteriores com anexos em uma thread de seis mensagens; por isso a prévia v8 usou o assunto isolado `Um presente para o seu negócio: 1 mês de Profissional 🎁`, sem attachments, enviada somente para `marianadosreisvasconcelos7@gmail.com`, id Resend `5a5d6cec-c9b4-435d-baa8-4b173903c486`. Ainda é necessário confirmar visualmente a nova thread no Gmail e tocar o CTA no celular. A chave usada foi compartilhada no chat e deve ser rotacionada após a confirmação visual final.
