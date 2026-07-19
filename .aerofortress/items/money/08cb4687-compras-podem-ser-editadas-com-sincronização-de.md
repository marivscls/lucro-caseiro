---
id: 08cb4687-b997-4d1c-a215-4dc837f0630c
slug: money
type: decision
title: Compras podem ser editadas com sincronização de caixa e estoque
tags: compras, edicao, financeiro, estoque, mobile, pwa
provenance: dito
evidence: Pedido e aprovação da usuária em 2026-07-19; packages/contracts/src/schemas/purchase.ts; apps/api/src/features/purchases/purchases.usecases.ts; apps/mobile/src/features/purchases/components/create-purchase-form.tsx; apps/mobile/src/features/purchases/components/purchase-card.tsx; 641 testes API, 340 mobile, typechecks, lint direcionado e build:pwa:caseiro aprovados
decay: stable
created: 2026-07-19T23:28:16.025788+00:00
updated: 2026-07-19T23:28:16.025788+00:00
validated: 2026-07-19T23:28:16.025788+00:00
links:
---

Decisão aprovada e implementada em 2026-07-19: cada card de Compra oferece a ação Editar e reutiliza o formulário de cadastro. Compras pendentes podem alterar fornecedor, descrição, valor/itens, categoria e data. Em compras pagas, valor, descrição e categoria são sincronizados com o lançamento financeiro vinculado, preservando a data real do pagamento. Quando há itens de estoque, a edição aplica somente o delta por produto/variação; reduções são recusadas se parte do estoque recebido já tiver sido vendida. O status de pagamento continua sendo alterado exclusivamente pela ação “Marcar como paga”.
