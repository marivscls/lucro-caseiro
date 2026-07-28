---
id: 122b8f5d-34e4-4ab2-a3b4-85446518b36b
slug: ui
type: decision
title: Inspirações internacionais viraram seis melhorias integradas aos fluxos existentes
tags: dribbble, vendas, produtos, financeiro, orcamentos, agenda, insights, mobile
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/src/features/products/components/create-product-form.tsx; apps/mobile/src/features/finance/components/finance-dashboard.tsx; apps/mobile/src/features/quotes/components/quote-form.tsx; apps/mobile/src/app/tabs/agenda.tsx; apps/mobile/src/app/insights.tsx; typecheck/lint/374 testes/build PWA verdes em 2026-07-24
decay: stable
created: 2026-07-24T23:16:26.765439500+00:00
updated: 2026-07-24T23:16:26.765439500+00:00
validated: 2026-07-24T23:16:26.765439500+00:00
links:
---

Em 2026-07-24 a usuária pediu implementar todas as recomendações aproveitáveis da auditoria link a link do Dribbble, exceto o grupo explicitamente marcado como não implementar. A implementação consolidou as referências em seis evoluções, sem criar módulos paralelos: venda em cliente→produtos→pagamento→revisão com estoque e acesso ao recibo; produto em blocos com ganho bruto/margem sobre preço; financeiro Hoje/7 dias/Mês com recebido/a receber; orçamento com item do catálogo e conversão canônica em encomenda; agenda com faixa de sete dias; insights Premium com alertas explicáveis e links de ação. Itens de orçamento continuam convertendo em encomenda, não diretamente em Sale, porque o contrato QuoteItem não persiste productId; inventar esse vínculo seria incorreto.
