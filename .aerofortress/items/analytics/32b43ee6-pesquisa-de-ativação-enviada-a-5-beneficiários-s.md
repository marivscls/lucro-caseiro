---
id: 32b43ee6-3f47-4cdc-ad34-d0db185ed90a
slug: analytics
type: fact
title: Pesquisa de ativação enviada a 5 beneficiários sem retorno
tags: pesquisa, ativação, email, resend, campanha, retenção
provenance: observado
evidence: Execução via Railway production @lucro-caseiro/api em 2026-08-15: selected=5, accepted=5, failed=0; message ids 04d8bed4-4d5b-409a-94b5-6c26598017ed, b3c2fa45-3a7a-4c7e-9e1f-087dd3638b28, ee5a22aa-debb-4769-adc7-249cab490876, f8a8abea-8294-4f7b-90ea-ad8492102fc1, 81c08f53-722a-45f6-aba9-4b65b5eb95d1
decay: volatile
created: 2026-08-15T16:48:16.322388400+00:00
updated: 2026-08-15T16:48:16.322388400+00:00
validated: 2026-08-15T16:48:16.322388400+00:00
links:
---

Em 2026-08-15, a pesquisa curta de ativação foi enviada a 5 beneficiários automáticos da campanha `professional-first-100-2026`. A seleção exigiu conta ativa com Profissional vigente, nenhuma atividade em dia posterior à concessão e nenhum registro de produto, venda, cliente, receita, encomenda, orçamento ou financeiro desde a concessão. O Resend aceitou os 5 envios e nenhum falhou. As chaves idempotentes seguem `activation-feedback-outreach-v1-<hash-do-destinatário>`. O `Reply-To` de cada mensagem foi definido explicitamente como `marianadosreisvasconcelos7@gmail.com`, sem alterar a configuração global ainda vazia.
