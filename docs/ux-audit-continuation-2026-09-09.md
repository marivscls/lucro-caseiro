# Continuação da auditoria UX/UI — 09/09/2026

## Estado encontrado

O checkout estava em `main` (`2074d8e7`), com muitas alterações locais anteriores. Os cinco worktrees citados no plano do Warp não existiam. Não havia evidência de conclusão ou verificação dos cinco lotes.

Vendas/Financeiro e Precificação estavam parcialmente implementados: cores semânticas, aviso de custos, cancelamento em alerta, atalho móvel de venda rápida, custo no modo simples, CTA da receita e fade já tinham mudanças. Faltavam totais que herdavam verde do componente Typography, ajustes no desktop, metadados e custo no modo completo. Paywall, ações operacionais e correções de Clientes/Agenda/Fornecedores continuavam pendentes.

Foram criados cinco worktrees locais em `tmp/ux-continuation/{sales,pricing,paywall,operations,bugs}`, baseados em main e contendo uma cópia das alterações existentes. Os incrementos foram revisados antes da aplicação à árvore principal. Não houve commit, merge de branches, PR ou publicação.

## Resultado por lote

| Lote                            | Implementação concluída                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vendas e Financeiro             | Totais/subtotais de venda neutros, inclusive resumos desktop, valor por peso e recibo; SaleCard flat com borda do tema; header sem rgba local; entrada verde/saída alerta, inclusive saldo agrupado e ícone do lançamento; aviso de custos preservado; cancelamento em alerta. Venda rápida disponível em mobile e desktop para um produto sem cliente, com pagamento explícito em dinheiro, bloqueio durante salvamento e espaço do rodapé medido. |
| Precificação e produtos         | Receita envia custo unitário, nome e categoria. Preço/custo/identidade chegam a initialValues do cadastro. Valores monetários inválidos de rota são ignorados, preservando zero. Modo completo também envia custo. Fade de 150 ms cancela a animação anterior e respeita movimento reduzido.                                                                                                                                                        |
| Paywall e planos                | Checkout transmite contexto de getPaywallCopy; cabeçalho usa title/message; benefícios vêm de TIER_BENEFITS/tierBenefitsFor. Banner usa premiumBg e não tem sombra. Planos tem skeleton; cards neutros, borda normal do tema e destaque Profissional por badge/contorno. Apenas o CTA Profissional é rosa preenchido.                                                                                                                               |
| Ações operacionais              | Cobrar em Fiado usa outline; Marcar como paga também. Compras mostra a ordenação real — pendentes primeiro, depois recentes — sem seta de um controle inexistente. QuoteCard sem sombra nos dois layouts. ServiceCard anuncia abertura de detalhes. Gastos recorrentes usa tokens e diferencia Remover em alertOutline de Editar primário, incluindo ícone correto no modo escuro.                                                                  |
| Clientes, Agenda e Fornecedores | Editar cliente aparece sem telefone. Dica da Agenda persiste por conta/aparelho via AsyncStorage, sem flash durante leitura; \_OrderDetail removido. Menus e ordenação de Fornecedores usam StandardModal, preservando callbacks e confirmações; card sem sombra. Orientação tem fade de 180 ms, respeita movimento reduzido e mantém um CTA grande; ações secundárias são texto com alvo de 48 dp.                                                 |
| Identificação web               | Login e cabeçalho da sidebar exibem “Central de Marketing — equipe”.                                                                                                                                                                                                                                                                                                                                                                                |

## Referências das mudanças visuais

- `apps/mobile/src/app/tabs/new-sale.tsx`: resumos, revisão, total selecionado e subtotal por peso recebem `theme.colors.text`; rodapés medidos por `onLayout`.
- `apps/mobile/src/app/tabs/sales.tsx`: caixa de recebimentos usa superfície/borda/texto do tema; valores das linhas de venda e encomenda são neutros.
- `apps/mobile/src/features/sales/components/sale-card.tsx:76`: borda do tema e remoção da faixa lateral; `:119`: total neutro. Remoção anterior da sombra preservada.
- `apps/mobile/src/features/sales/components/sale-detail.tsx`: desconto e total neutros; cancelamento `alertOutline` preservado.
- `apps/mobile/src/features/sales/components/receipt-preview-modal.tsx`: papel usa `surfaceElevated`, acompanhando o tema escuro; texto e total neutros.
- `apps/mobile/src/features/finance/components/create-finance-entry.tsx`: valor segue o tipo do lançamento; fundo dos ícones deixa de sugerir entrada nos campos neutros.
- `apps/mobile/src/features/finance/components/finance-dashboard.tsx`: saldo dos grupos segue success/alert; alterações anteriores de aviso e filtro de período preservadas.
- `apps/mobile/src/app/plans.tsx:99`: skeleton; `:290`: borda semântica; `:383`: hierarquia dos CTAs.
- `apps/mobile/src/features/subscription/components/limit-banner.tsx:54`: fundo premiumBg e card sem sombra.
- `apps/mobile/src/app/fiado.tsx`: retirada a condição de preenchimento do botão Cobrar de cada venda vencida.
- `apps/mobile/src/features/purchases/components/purchase-card.tsx`: variante outline e remoção do override rosa de Marcar como paga.
- `apps/mobile/src/app/purchases.tsx`: retirada a seta decorativa e o import ocioso; rótulo acessível identifica a ordenação existente.
- `apps/mobile/src/app/quotes.tsx`: retirado `shadow="sm"` das duas versões de QuoteCard.
- `apps/mobile/src/app/services.tsx`: rótulo “Ver detalhes de …”.
- `apps/mobile/src/app/recurring-expenses.tsx:74`: mapa de tokens para as categorias; `:500`: resolução pelo tema; `:984`: primaryBg no detalhe ilustrado; Remover em alertOutline e Editar sem override de preenchimento.
- `apps/mobile/src/features/suppliers/components/supplier-card.tsx`: retirada a sombra; menu em modal separado preserva as ações existentes.
- `apps/mobile/src/shared/guidance/screen-guidance.tsx`: entrada/dispensa animadas; secundário, dispensa e suporte em texto tocável.

Detalhes de cada lote e comandos estão em [relatórios dos lotes](ux-audit-continuation-reports/).

## Verificação

- Estado inicial: **100 arquivos / 645 testes passaram**; typecheck mobile passou.
- Após integração: **109 arquivos / 681 testes passaram**, com Vitest (`node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=1`, em apps/mobile).
- Build Expo web local final passou: `expo export --platform web --output-dir ../../tmp/ux-continuation/web-export --max-workers 2`.
- Typecheck e lint dos arquivos dos cinco lotes passaram nos worktrees. Revisão independente dos callbacks e da integração não encontrou bloqueios atribuíveis aos lotes.
- Typecheck de `packages/ui` passou. Typecheck do web e ESLint dos dois arquivos web alterados passaram.
- Context lint mobile passou com aviso anterior: `verticals/` não tem contexto.
- Não houve inspeção visual em dispositivo, teste físico Android/iOS ou transação real de venda/assinatura. Testes de comportamento usam fronteiras simuladas e não efetuam cobranças nem enviam mensagens.

## Limitação da verificação da árvore principal

Durante esta execução surgiram alterações paralelas adicionais em Precificação, ausentes dos snapshots iniciais. Foram preservadas, inclusive edições simultâneas da aparência da calculadora simples. A última checagem geral da árvore principal apontou:

- **Typecheck: 4 erros externos aos lotes**, em `features/pricing/components/pricing-summary.tsx` (tokens `warning`/`danger` inexistentes) e `features/pricing/components/unified-pricing-calculator.tsx` (argumento passado a `useCalculatePricing`, cuja assinatura então não o aceitava).
- **Lint: 8 erros externos aos lotes**, em `features/pricing/components/pricing-cost-details.tsx`, `features/pricing/components/unified-pricing-calculator.tsx` e `features/pricing/use-pricing-draft.ts` (ternários aninhados, asserções desnecessárias e condições invertidas).

Assim, os incrementos da auditoria estão implementados e integrados, mas a árvore principal inteira ainda não pode ser declarada aprovada em typecheck/lint. Os logs dessa checagem estão em `tmp/ux-continuation/final-tests.log`, `final-lint.log` e `final-build.log`; os arquivos continuam sujeitos à outra edição em andamento.

## Decisão de produto pendente

A convergência completa do design system da Central de Marketing com o aplicativo do MEI continua pendente de decisão de produto. Esta rodada implementou apenas a etiqueta de identificação solicitada. A varredura de cores ficou limitada aos pontos da auditoria; não houve redesenho geral nem alteração comercial dos planos.
