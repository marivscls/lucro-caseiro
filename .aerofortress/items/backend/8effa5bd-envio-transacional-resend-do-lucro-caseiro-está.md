---
id: 8effa5bd-8cb8-4497-9767-8c1839e3dfe1
slug: backend
type: fact
title: Envio transacional Resend do Lucro Caseiro está operacional
tags: 
provenance: observado
evidence: apps/api/src/features/email/professional-trial-email.ts; apps/api/src/features/email/assets/; execução Railway/Resend em 2026-08-06
decay: seasonal
created: 2026-08-06T13:31:11.407011300+00:00
updated: 2026-08-06T15:21:32.688723600+00:00
validated: 2026-08-06T15:21:32.688723600+00:00
links: 
---

Em 2026-08-06, `RESEND_API_KEY` foi configurada no serviço Railway `@lucro-caseiro/api` sem redeploy. O remetente é `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>`, no domínio raiz verificado. A usuária confirmou no Gmail o recebimento dos testes. O template final do presente Profissional reproduz a referência aprovada: hero rosa com presente 3D, chamada `Lucro Caseiro é parceria que gera resultados`, painel financeiro, faixa de quatro benefícios, CTA `Explorar meu plano` e rodapé. Os PNGs transparentes são incorporados por CID; o selo `1 MÊS GRÁTIS` usa o pequeno presente 3D, e os blocos `Tudo do Profissional`/`Aproveite ao máximo` usam respectivamente os PNGs de estrela e coração fornecidos, ambos exibidos em 46×46 px. Previews desktop e mobile foram renderizados localmente. A prévia v6 foi aceita apenas para `marianadosreisvasconcelos7@gmail.com` com id `64747d90-6964-4aa7-9809-4fc96bdc2a45`. A chave usada foi compartilhada no chat e deve ser rotacionada após a confirmação visual final.
