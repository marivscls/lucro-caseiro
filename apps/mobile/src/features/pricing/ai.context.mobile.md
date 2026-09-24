# ai.context.mobile.md — Pricing

## Purpose

Uma única precificação em `/pricing`, dividida em três etapas: produto e custos, trabalho e despesas, preço e resultado. `/pricing-complete` preserva links antigos redirecionando para a mesma tela. Custo, embalagem, ganho, trabalho e rateio por produção estão disponíveis em qualquer plano; rateio por faturamento e perfis salvos de canal exigem `advancedPricing`.

## Non-goals

- Não consulta preços de concorrentes nem promete lucro líquido.
- Não altera o preço do produto ao salvar uma simulação.
- Não cria vínculos presumidos para cálculos antigos ou valores manuais.

## Boundaries & Ownership

Depende de contracts (cálculos e DTOs), products (cadastro e alteração do preço base), recipes (custo atual), packaging, finance (despesas recorrentes), goals e subscription. O preço é aplicado pela API de products somente após confirmação explícita na interface.

## Code pointers

- `components/unified-pricing-calculator.tsx`: fluxo único, importação, revisão e confirmação.
- `components/pricing-step-layout.tsx`: progresso, painéis e rodapé com Voltar, Continuar e Salvar cálculo; mantém os painéis montados para preservar detalhes ainda não aplicados.
- `components/pricing-fields.tsx`: campos, seções expansíveis e seleção pesquisável.
- `components/pricing-cost-details.tsx`: trabalho, despesas e canais.
- `components/pricing-summary.tsx`: composição, preço alternativo, ganho e margem.
- `use-pricing-draft.ts`: estado do formulário, restauração e validação.
- `pricing-model.ts`: simulação por preço e identificação de custos aumentados.
- `use-pricing-sources.ts`: cadastros e histórico completos, com paginação e atualização ao focar.
- `hooks.ts`, `api.ts`: integração HTTP e cache.
- `pricing-improvements.test.ts`, `calc.test.ts`: cenários e regressões de cálculo.
- `components/pricing-history-modal.tsx`: histórico compartilhado.
- Os componentes antigos SimplePricingCalculator/PricingCalculator foram preservados, mas não são usados pelas rotas de precificação.

## Components

A rota controla a etapa atual; o botão do cabeçalho e o retorno do Android voltam uma etapa antes de sair. Sem histórico, o fallback usa `router.navigate("/tabs/more")` — `replace`/`push` disparavam REPLACE num navigator sem a rota `more`. A navegação e o salvamento ficam bloqueados durante requisições. Cada avanço valida os campos já apresentados; salvar valida o rascunho completo e retorna à primeira etapa inválida. Trabalho, despesas, taxas, simulação alternativa e composição começam recolhidos. O rodapé permanece fora da rolagem, acima do espaço reservado à navegação global.

`UnifiedPricingCalculator` aceita custo inicial, productId inicial, metadados de nome/categoria vindos da receita, callbacks de salvamento e criação. `PricingSummary` permite simular outro preço; mostra margem sobre a venda efetiva, despesas e taxas recalculadas. O resultado identifica custos ausentes, inclusive ao restaurar zeros de históricos sem confirmação.

Na primeira etapa, o produto escolhido aparece como seleção atual, separado dos custos editáveis. Trocar o produto e calcular sem cadastro são ações explícitas; ingredientes/material e embalagem são apresentados como custos de uma unidade, com a origem e a possibilidade de ajuste explicadas junto ao campo. Os cadastros são atualizados automaticamente ao focar a tela, sem ação manual de atualização.

A introdução reaproveita a ilustração original `pricingCostsHero` via `useBrandIllustration`,
em tamanho compacto ao lado do título. A descrição, os campos e o resultado conservam
a largura disponível; a imagem é decorativa e acompanha a variante da marca.
O resultado também reaproveita `pricingResultHero`, ao lado do rótulo do preço sugerido,
em 96 × 64 px. O valor fica abaixo, com toda a largura do cartão disponível.

O histórico usa cartões compactos com nome visível do produto, data, preço sugerido,
custo e acréscimo. O filtro é um seletor pesquisável com nome completo e quebra de linha,
sem faixa horizontal cortada; trocar o filtro reinicia a rolagem da lista. Produtos indisponíveis são diferenciados de cálculos avulsos,
e falhas de carregamento oferecem nova tentativa.

## Hooks

- `usePricingSources`: produtos, receitas, embalagens e cálculos de todas as páginas. Falhas são visíveis e permitem repetir; valores manuais continuam utilizáveis.
- `usePricingDraft`: estado local com origem independente do vínculo ao produto.
- `useCalculatePricing(true)`: endpoint v2 para impedir gravação silenciosa em um backend antigo.
- `usePricingPreferences(professional)`: busca perfis somente quando o plano permite.
- `useUpdatePricingPreferences`, `usePricingRevenueHistory`: preservam os recursos profissionais.

## API Integration

- POST `/api/v1/pricing/calculate-v2`: salva cálculo sugerido e sourceSnapshot.
- PATCH `/api/v1/products/:id`: aplica somente salePrice após confirmação; não altera preços de variações.
- GET `/api/v1/pricing`: histórico paginado.
- GET/PUT `/api/v1/pricing/preferences`: canais profissionais.
- As APIs de produtos, receitas, embalagens, despesas recorrentes e metas fornecem as origens.

## Contracts

`CreatePricing` e `Pricing` incluem `sourceSnapshot` opcional: origem do material, recipeId, embalagens selecionadas com valores, premissas mensais e confirmação dos campos opcionais. Históricos antigos continuam legíveis sem esse objeto. Os valores monetários usam R$; acréscimo sobre custo é distinguido da margem sobre venda.

No rateio por unidades: `base = (direto + fixoPorUnidade) * (1 + acrescimo)`; `final = base / (1 - taxa)`.
No rateio por faturamento: `final = (direto + ganhoAlvo) / (1 - indiretos% - taxas%)`. Ambos os percentuais incidem sobre o mesmo preço final. A soma deve ser menor que 100%.

## Error Handling

- Campos incompletos, NaN, percentuais inviáveis e preços acima de MAX_MONEY impedem ações.
- Cadastros excluídos ou alterados durante a edição exigem revisão ou entrada manual.
- Cancelar a confirmação não gera requisições de gravação.
- A falha ao salvar impede a alteração do produto. Se a aplicação falhar depois de salvar, o alerta explica que apenas o histórico foi salvo.
- A criação só abre após o cálculo ser salvo.

## Performance

Cálculos locais, sem requisição a cada tecla. Cadastros usam cache React Query e são recarregados ao focar a tela. Histórico percorre todas as páginas para não perder produtos antigos; cada produto/canal é comparado somente com seu último cálculo. Não há polling em segundo plano.

## Test matrix

- `pricing-steps.test.ts`: validação por etapa, custos alterados, campos opcionais, taxas e retorno à primeira etapa inválida.
- `components/pricing-step-layout.test.tsx`: uma etapa visível, preservação de detalhes ao voltar, bloqueio de saltos e salvamento pela ação final.

- Fórmulas com trabalho, taxa, rateio por unidade e faturamento.
- Acréscimo versus margem e simulação de prejuízo.
- Receita atual diferente do custo armazenado no produto.
- Embalagem aumentada, origem excluída, registros substituídos e origens manuais.
- Campos ausentes não são convertidos em zeros confirmados.
- Navegador com fixtures: confirmação/cancelamento, falhas, plano gratuito, redirecionamento e larguras 320/390/768/1024/1440.

## Examples

Produto: custo antigo R$ 10, receita atual R$ 12, embalagem antiga R$ 1 e atual R$ 2. O alerta identifica aumento de R$ 3 e Recalcular carrega R$ 12 + R$ 2. Com ganho R$ 6 e taxa 10%, o preço sugerido arredondado é R$ 22,23. Simular R$ 25 mostra ganho de R$ 8,50 e margem de 34% com esses custos.

## Change log / Decisions

- 2026-09-09: unificação dos cinco aprimoramentos; snapshot persistido na migration 063; endpoint v2 exige publicação coordenada com a API. Migrações e backend devem preceder o aplicativo atualizado.
- O histórico preserva a sugestão calculada; o preço comercial escolhido é salvo no produto. Alertas representam revisão dos cálculos, não uma garantia sobre o preço comercial.

- 2026-09-09: campos de taxa e seções expansíveis compartilham fade/deslocamento de 16 px por 280 ms e seta animada. Ao recolher, campos saem imediatamente da navegação assistiva e do teclado; reabrir durante a saída cancela a remoção. Movimento reduzido torna a mudança imediata.

## Padrão de progresso — 2026-09-09

A precificação usa o componente compartilhado de etapas, com número, nome completo da etapa atual, rótulos curtos e retorno apenas a etapas já alcançadas.

- 2026-09-10: Revisão de cortes no PWA/mobile. Seletores de produto e embalagem usam FilterChipRow com quebra de linha e opções limitadas à largura disponível. Validação visual em 320, 390, 500 e 1440px com dados locais simulados.

## Desktop (web >= 1024px) — 2026-09-23

Só no desktop; o celular continua com `FormStepProgress`, rodapé fixo e cabeçalho fora da rolagem.

- `PricingStepLayout` recebe `header` e `aside`. No desktop a página rola inteira: o cabeçalho (título, subtítulo e "Histórico" como `DesktopToolbarButton`) vem de `app/pricing.tsx`, as etapas usam `DesktopStepper` e o título da etapa aparece uma vez no conteúdo.
- `DesktopSplit`: a lateral fixa traz o resumo e as ações. "Continuar" ou "Salvar cálculo" ocupa a largura da lateral, com "Voltar" abaixo. Não existe botão de largura total na coluna.
- Etapas 1 e 2: `PricingCostPreview` (em `components/pricing-desktop.tsx`) soma ingredientes, embalagem, trabalho e despesas por unidade (despesas ÷ produção, apenas no rateio por unidades), com o total de 36px. Avisa que o preço sugerido aparece na etapa 3.
- Na etapa 1, os custos de ingredientes e de embalagem ficam lado a lado em `DesktopFormGrid` (uma coluna em 1024px).
- Etapa 3: a coluna principal mostra "Quanto você quer ganhar?" e, abaixo, o `PricingSummary` completo, com simulação, composição e aplicar ou criar produto. A lateral mostra `PricingResultPreview`, com o preço sugerido (ou simulado), o ganho ou prejuízo e a margem, pelas mesmas contas do `PricingSummary` (`pricingQuote` e `evaluateSalePrice`).
- No desktop, o rótulo do `PricingSummary` fica em caixa normal ("Preço sugerido por unidade").
- Botões "Selecionar produto cadastrado", "Usar embalagem cadastrada" e os avisos de custo alterado têm a largura do texto no desktop (`PricingPicker` usa `desktopActionButton`).
