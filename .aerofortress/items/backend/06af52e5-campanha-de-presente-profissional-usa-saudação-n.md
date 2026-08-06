---
id: 06af52e5-258d-421a-bf5d-898a2a340837
slug: backend
type: scar
title: Campanha de presente Profissional usa saudação neutra e coorte exata
tags:
provenance: dito
evidence: Mensagens da usuária em 2026-08-06; consulta read-only de public.users na produção
decay: stable
created: 2026-08-06T16:08:39.689085700+00:00
updated: 2026-08-06T16:08:39.689085700+00:00
validated: 2026-08-06T16:08:39.689085700+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-06): antes do disparo promocional, a usuária retirou a personalização por primeiro nome por receio de o nome de teste `Mariana` vazar para destinatários reais e reduziu a coorte de 11 para exatamente 8 contas. REGRA DESTA CAMPANHA: o corpo deve começar somente com `Oi!`, sem nome; destinatários autorizados são Letícia Gomes, Ana Carolina Souza Vieira, Anndreia Moreira, VESTE BELLE, Ana Paula Melo, Fernanda Bueno, José Santiago e Manoel Santos. Ana Clara, Elmo, Eduarda, Maria e todas as contas Mariana/screenshot/teste ficam fora. COMO EVITAR: o script de campanha deve ter allowlist explícita, conferir que o HTML/texto não contêm `Mariana` nem saudação personalizada e fazer dry-run antes de qualquer UPDATE ou envio.
