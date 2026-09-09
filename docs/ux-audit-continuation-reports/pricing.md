# Continuidade UX — lote 2 (precificação/produtos/receitas)

## Ponto em que Warp parou

- Já havia transferência salePrice/costPrice do modo simples e campos separados no formulário.
- CTA da receita já importava custo por unidade, mas descartava nome/categoria.
- Fade de 150 ms já existia, sem cancelamento ao mudar valor ou restaurar opacidade com movimento reduzido.
- Modo completo ainda enviava somente preço; initialValues não aceitava valores monetários.

## Continuação implementada

- Nome visível e categoria seguem receita → cálculo simples → novo produto enquanto a origem da receita permanece ativa.
- Modo completo envia também custo total.
- Produtos recebe preço, custo, nome e categoria via initialValues, preservando props legadas.
- Parser ignora valores de rota negativos, vazios ou não finitos; zero permanece válido. Cadastro manual não importa parâmetros.
- Fade cancela animação anterior e restaura opacidade 1 com movimento reduzido.
- Corrigido ternário aninhado já existente no hint da receita que reprovava o lint.
- Contextos de Pricing, Products e Recipes atualizados.

## Arquivos alterados em relação ao início deste agente

- apps/mobile/src/app/pricing.tsx
- apps/mobile/src/app/pricing-complete.tsx
- apps/mobile/src/app/products.tsx
- apps/mobile/src/features/pricing/components/simple-pricing-calculator.tsx
- apps/mobile/src/features/pricing/components/pricing-calculator.tsx
- apps/mobile/src/features/pricing/ai.context.mobile.md
- apps/mobile/src/features/products/components/create-product-form.tsx
- apps/mobile/src/features/products/pricing-initial-values.ts (novo)
- apps/mobile/src/features/products/pricing-initial-values.test.ts (novo)
- apps/mobile/src/features/products/ai.context.mobile.md
- apps/mobile/src/features/recipes/components/recipe-detail.tsx
- apps/mobile/src/features/recipes/ai.context.mobile.md
- UX-REPORT.md (este relatório; não copiar para produção)

## Verificação

- TDD: testes novos escritos primeiro; stub inicial falhou com 7 assertions; implementação passou 8 testes.
- pnpm --filter @lucro-caseiro/mobile test -- src/features/products/pricing-initial-values.test.ts src/features/pricing/calc.test.ts src/features/products/kit.test.ts src/features/recipes/domain.test.ts: PASS, 4 arquivos/45 testes. Esbuild precisou execução local fora do sandbox por leitura de ancestrais bloqueada.
- pnpm --filter @lucro-caseiro/mobile typecheck: PASS.
- pnpm context:lint:mobile: PASS; aviso preexistente verticals sem contexto.
- pnpm --filter @lucro-caseiro/mobile lint: identificou somente um ternário aninhado preexistente no arquivo alterado; corrigido. ESLint direto nos 9 arquivos TS/TSX alterados: PASS após correção.
- Prettier aplicado aos TS/TSX alterados.
- Sem commit/PR. Sem edição na árvore raiz/theme. Sem verificação visual em navegador neste lote.

## Limites preservados

- Feature custoDireto continua governando a gravação/exibição de custo no produto.
- O comportamento existente de navegar antes de aguardar persistência do cálculo foi preservado.
