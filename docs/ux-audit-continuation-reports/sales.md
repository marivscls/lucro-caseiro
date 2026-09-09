# Continuidade UX — revisão/finalização do lote 1

## Estado recebido

O worktree já continha as alterações visuais de Vendas/Financeiro feitas pelo agente principal. A venda rápida existia somente no rodapé mobile da etapa de produtos; o espaço reservado para esse rodapé ainda usava altura fixa de 68 px. O submit já aceitava `paymentOverride` e usava `effectivePayment` no payload.

## Alterações deste agente

- `QuickSaleButton` compartilhado entre rodapé mobile e resumo lateral desktop na etapa 2.
- Mantém elegibilidade: exatamente uma linha no carrinho e nenhum cliente.
- Usa Button do design system, variante texto e alvo de 48 px, com loading bloqueando outro clique.
- Envia `cash` explicitamente ao handleSubmit existente; removida atualização redundante de paymentMethod antes do submit.
- Mede altura dos rodapés por onLayout, reservando espaço real para a nova linha e fontes ampliadas.
- Contexto de Sales documenta o atalho, preservação do fluxo completo e semântica visual já aplicada pelo agente principal.

## Arquivos alterados SOMENTE por este agente

- apps/mobile/src/app/tabs/new-sale.tsx
- apps/mobile/src/features/sales/components/quick-sale-button.tsx (novo)
- apps/mobile/src/features/sales/components/quick-sale-button.test.tsx (novo)
- apps/mobile/src/features/sales/ai.context.mobile.md
- UX-REPORT.md (este relatório; não copiar para produção)

## Verificação

- TDD: 5 testes escritos primeiro; stub inicial retornava null e 2 testes falharam pela ausência da ação. Após implementação: 5/5 PASS.
- node node_modules/vitest/vitest.mjs run src/features/sales/components/quick-sale-button.test.tsx src/features/sales/cart.test.ts src/features/sales/hooks.test.ts --maxWorkers=2 --minWorkers=1: PASS, 2 arquivos encontrados/16 testes (não existe hooks.test.ts neste slice).
- pnpm --filter @lucro-caseiro/mobile typecheck: PASS.
- ESLint direcionado nos 3 arquivos TSX alterados: PASS após marcar props readonly.
- pnpm context:lint:mobile: PASS, aviso preexistente verticals sem contexto.
- Prettier aplicado aos 3 TSX.
- Revisão do submit: payload lê effectivePayment = paymentOverride ?? paymentMethod; mantém items/quantity/variations, desconto/notas, checkSalesLimit, fallback de LIMIT_EXCEEDED e payload da fila offline. Não alterei essa implementação.
- Revisei totais neutros, Cancelar venda em alertOutline e Entradas/Saídas verde/alerta nas alterações visuais recebidas; preservadas.
- Sem teste end-to-end de API ou revisão visual no navegador neste lote. Sem commit/PR ou alteração na árvore raiz.
