---
id: 57c69300-609f-439e-9f78-26efc3040b6f
slug: money
type: scar
title: Compras: ação de pagar precisa ser travada e confirmada pelo ID selecionado
tags: compras, pagamento, id, concorrencia, financeiro
provenance: observado
evidence: apps/mobile/src/app/purchases.tsx; apps/mobile/src/features/purchases/components/purchase-card.tsx; apps/mobile/src/features/purchases/hooks.ts; apps/api/src/features/purchases/purchases.usecases.test.ts; screenshot/relato da usuária em 2026-07-12
decay: stable
created: 2026-07-13T02:41:58.662592200+00:00
updated: 2026-07-13T02:41:58.662592200+00:00
validated: 2026-07-13T02:41:58.662592200+00:00
links: 
---

SINTOMA (2026-07-12): a usuária tocou para marcar uma compra como paga e viu várias compras como pagas. A tela compartilhava `payPurchase.isPending` entre todos os cards e não tinha uma trava síncrona por ID antes do próximo render. O backend já restringia o UPDATE por `user_id + purchase.id`, mas faltava defesa explícita no cliente e uma regressão que provasse o ID encaminhado. CORREÇÃO: `payingIdRef` bloqueia imediatamente qualquer segundo disparo enquanto uma compra está sendo paga; somente o card selecionado mostra loading; todos os botões ficam desabilitados durante a operação; mutations são serializadas; a tela valida que a resposta contém o mesmo ID e status `paid`; teste do use case exige que `repo.update` receba exatamente o ID selecionado. COMO EVITAR: ações financeiras em listas nunca devem depender apenas do estado assíncrono global da mutation — usar trava síncrona por registro e conferir a identidade retornada pela API.
