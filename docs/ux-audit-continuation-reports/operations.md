# Lote 4 — Ações operacionais e cores

## Revisão independente

Comparação feita arquivo a arquivo contra o baseline preservado no worktree pricing, evitando atribuir alterações anteriores do usuário a este lote. As seis mudanças deste lote atendem ao plano sem alterar callbacks, contratos, pagamentos, filtros ou ordenação de domínio.

## Arquivos alterados desde o baseline

1. apps/mobile/src/app/fiado.tsx
2. apps/mobile/src/app/purchases.tsx
3. apps/mobile/src/features/purchases/components/purchase-card.tsx
4. apps/mobile/src/app/quotes.tsx
5. apps/mobile/src/app/services.tsx
6. apps/mobile/src/app/recurring-expenses.tsx

## O que foi concluído e conferido

- Fiado: removido filled condicionado a overdue no CardAction Cobrar. Todas as cobranças repetidas agora usam o outline existente; handlers de WhatsApp e recebimento permanecem iguais. O menu de cobrança continua como linha textual, sem botão rosa adicional.
- Compras: removidos chevron-down e import iconSizes do indicador sem ação. Rótulo estático Pendentes primeiro e descrição acessível Pendentes primeiro, depois mais recentes refletem a composição real sortPurchasesPendingFirst(sortPurchasesMostRecentFirst(...)). Filtros e lista mantidos.
- PurchaseCard: Marcar como paga agora é outline; removido override backgroundColor pal.rose. onPay, loading e disabled preservados.
- QuoteCard: removido shadow=sm nas duas versões responsivas. Card elevated mantém sua borda; esse variant não adiciona sombra por padrão.
- ServiceCard: accessibilityLabel passa de Abrir opções para Ver detalhes de [nome], coerente com onPress que seleciona o serviço e abre os detalhes.
- Gastos recorrentes: CATEGORY_SURFACES agora é um mapa tipado de tokens do tema (surface, yellowBg, blueBg, lavenderBg), resolvido para ambos os temas. commitmentBlob usa primaryBg. Remover usa alertOutline e ícone alert; retirados overrides de preenchimento de deleteAction/saveAction. Editar mantém o primary padrão.
- Ajuste encontrado na revisão: ícone Editar ainda usava palette.onWine (branco fixo), divergindo do texto escuro sobre rosa pastel no tema escuro. Corrigido para theme.colors.textOnPrimary, igual ao texto do Button primary, e removida referência palette agora ociosa de RecurringDetails.

Nenhum hex foi adicionado. Os oito hex do escopo nomeado em recurring-expenses foram eliminados. Há rgba anteriores em outras partes da ilustração do resumo; não foram alterados nesta varredura limitada.

## Verificação executada

- pnpm exec vitest run src/features/purchases/domain.test.ts --maxWorkers=2 --minWorkers=1: PASS, 11 testes (inclui agrupamento estável de pendentes, ordenação por data e contagens).
- pnpm typecheck em apps/mobile: PASS, após ajuste do ícone.
- node ../../node_modules/eslint/bin/eslint.js nos seis arquivos acima: PASS, após ajuste do ícone.
- git diff --check nos seis arquivos: PASS.

Mudanças puramente visuais e de nomenclatura acessível: não foram criados testes que apenas espelham estilos. Não houve verificação visual em navegador/dispositivo neste lote; contraste do ícone foi conferido nos tokens claro/escuro e implementação do Button. Sem alteração de spec de domínio, commit, PR ou publicação.
