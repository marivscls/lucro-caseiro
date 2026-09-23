# Início: primeiros passos, dia e mês

## Purpose

A tela Início muda conforme o momento da conta, em três fases (design "A", versão vinho, escolhido pelo dono em 2026-09-23):

1. **Primeiros passos** (`setup`): lista de três passos (produto, preço, primeira venda) com progresso e a ação do passo atual.
2. **Tudo pronto** (`ready`): faixa vinho "Tudo pronto, {nome}!" com o lucro da primeira venda, passos marcados, cartão de sequência (N de 7 dias), "Seu dia em números" e sugestões "Quando quiser, dá para ir além".
3. **Mês em uso** (`month`): destaque vinho "{Mês} até hoje" (vendi, sobrou no bolso, comparação com o mês anterior, barras da semana e melhor dia), cartão de sequência e meta, "Campeões do mês", "Fiado para receber" e, quando os dados sustentam, alerta de preço.

## Non-goals

Não calcular lucro contábil, enviar cobranças, mudar permissões, criar uma agenda paralela ou alterar regras financeiras do servidor. Não cria meta semanal (só existe a meta mensal de retirada). Não mostra alerta de aumento de insumo (não há consulta de histórico de custo no Início).

## Boundaries & Ownership

A rota `app/tabs/index.tsx` mantém autenticação, orientação inicial, decisão de fase e composição. Home apresenta dados; Agenda, Produtos, Precificação, Fiado e Financeiro mantêm formulários e detalhes. `business-profile.tsx` continua no fim da página (compacto após a primeira venda).

## Code pointers

- `domain.ts`: `homePhase` e `HOME_HISTORY_DAYS_FOR_MONTH`, passos, saudação, lucro estimado de venda, sequência, dias com venda, mês até hoje e comparação, semana, melhor dia da semana, campeões, clientes que voltaram, ritmo da meta, alerta de preço, estados de consulta, compromissos, recebimentos e alertas de estoque.
- `hooks.ts`: vendas pendentes paginadas, histórico de vendas desde o início do mês anterior (todas as páginas) e produtos completos.
- `components/`: `setup.tsx` (`HomeSetupSteps`, `HomeSetupTip`), `day-numbers.tsx` (`HomeDayPreview`, `HomeDayNumbers`), `ready.tsx` (`HomeReadyBanner`, `HomeStreakCard`, `HomeNextIdeas`), `month.tsx` (`HomeMonthHero`, `HomeHabitGoal`, `HomeChampions`, `HomeFiado`, `HomePriceAlert`), `agenda.tsx` (`HomeDay`, `HomeAttention`), `parts.tsx` (cartão, botões, avisos de consulta) e `styles.ts` (escala do mockup: títulos 17–40 px, corpo 16 px, legendas 13–15 px).
- `../../shared/brand-palette.ts`: tokens vinho/lima/rosa usados nos destaques (`wineFill`, `lime`, `rose`, `onWineMuted`, `wineBar`, `wineDivider`).
- `../../app/tabs/agenda.tsx`: parâmetros `orderId` e `create=home`.
- `../../app/products.tsx`: parâmetro `productId`.

## Components

Fase decidida por `homePhase`; enquanto qualquer entrada da regra carrega, a tela mostra só o cabeçalho e "Carregando seu Início…"; se falha sem cache, mostra aviso com nova tentativa.

- **Primeiros passos**: anel "N de 3", título "Falta pouco para ver seu lucro", passos com concluído riscado, passo atual destacado com botão (Cadastrar produto / Calcular agora / Anotar venda). Sem venda, "Seu dia em números" aparece esmaecido com "aparece depois da 1ª venda" (zero verdadeiro, não carregamento). No computador, cartão "Por que o preço primeiro?" com exemplo fixo marcado "Exemplo".
- **Tudo pronto**: faixa vinho com selo lima. Com uma venda: "Sua primeira venda deixou {lucro} no seu bolso"; com mais: "Suas vendas já deixaram {lucro} no seu bolso"; sem custo cadastrado, mostra o valor vendido. Botão "Anotar outra venda" só no celular (no computador a barra lateral já tem Nova venda). Cartão de sequência "Seu 1º dia anotando" / "{N} dias anotando", 7 segmentos, "N de 7 dias". "Seu dia em números": vendido hoje, lucro hoje, fiado a receber e a última venda. Sugestões: cadastrar mais produtos, definir a meta do mês, montar catálogo.
- **Mês em uso**: destaque vinho com vendi (branco) e sobrou no bolso (lima); pílula lima quando cresce, neutra quando cai; barras seg–dom da semana atual com hoje em lima; "{Dia} é o seu melhor dia". Celular mostra "Anotar venda" abaixo do destaque. Cartão de sequência e meta (no computador também vendas no mês e clientes que voltaram). Campeões do mês (até 3, por lucro estimado), Fiado para receber (até 2 clientes, total de todas as páginas, "Cobrar pelo WhatsApp" abre `/fiado`, onde a cobrança já existe) e alerta de preço.
- Agenda (`HomeDay`, com o valor previsto na agenda) e estoque baixo (`HomeAttention`) continuam abaixo das seções da fase 2 e 3. Ações rápidas, seletor Hoje/Mês e cartão Dinheiro foram retirados: tab bar, barra lateral e botões de venda cobrem as ações.

## Hooks

useHomePendingSales percorre todas as páginas; qualquer falha impede apresentar um total parcial. useHomeSalesHistory busca todas as páginas de `GET /sales` com `dateFrom` no início do mês anterior (horário local); falha em qualquer página rejeita. useHomeProducts reutiliza fetchAllProducts. Prefixos de cache sales/products recebem invalidação das operações existentes. useOrders aceita enabled para não consultar agenda desabilitada pela marca.

## API Integration

Somente consultas existentes de sales, finance, insights, goals, orders, products e a lista de precificações já usada. Nenhum novo endpoint ou migração. `GET /sales` passa a receber do app os filtros `dateFrom`/`dateTo` que a API já aceitava. Chamadas seguem apiClient autenticado. O servidor continua responsável pela autorização.

## Contracts

Order, Product, Sale, FinanceSummary, Insights e ProlaboreStatus de contracts.

**Regra de fase** (`homePhase`, pura):

- `month` quando há pelo menos `HOME_HISTORY_DAYS_FOR_MONTH` = **7 dias distintos com venda** no histórico carregado, ou quando `insights(6)` mostra venda num mês anterior ao início do histórico (conta antiga com pausa recente). Vale mesmo com passo pendente.
- senão `setup` quando falta produto, preço ou venda.
- senão `ready`.

**Passos**: produto = há produto; preço = há precificação salva **ou** produto com custo cadastrado; venda = há venda.

**Valores**:

- Venda não cancelada conta; cancelada é ignorada em tudo.
- Lucro estimado de uma venda = soma de (preço vendido − custo cadastrado do produto) × quantidade, menos o desconto. Fica completo quando cada item tem custo; caso contrário o valor é parcial e a tela avisa "Falta o custo de algum produto".
- Vendido hoje vem de `sales/summary/today`. Lucro hoje soma o lucro estimado das vendas de hoje.
- Fiado a receber = total menos paidAmount das vendas pendentes de todas as páginas.
- Vendi (mês) = total das vendas do mês até agora. Sobrou no bolso = `profit` do resumo financeiro do mês (entradas menos despesas registradas).
- Comparação: mês atual até hoje contra os mesmos dias do mês anterior (dia 1 até o mesmo dia, limitado ao fim do mês). Sem venda no mês anterior, não há pílula.
- Semana: segunda a domingo da semana atual, total vendido por dia. Melhor dia = dia da semana com maior total no histórico carregado.
- Sequência = dias seguidos com venda terminando hoje, ou ontem se hoje ainda não teve venda. Limitada ao histórico carregado.
- Vendas no mês = quantidade de vendas do mês. Clientes que voltaram = clientes com compra no mês e pelo menos duas compras no histórico.
- Campeões = produtos vendidos no mês ordenados pelo lucro estimado (desconto rateado pelo subtotal); produtos sem custo ficam de fora.
- Meta: `currentRevenue` de `requiredRevenue` do servidor (entradas). "No ritmo atual, você chega lá" quando entradas ÷ dias corridos × dias do mês ≥ alvo.
- Alerta de preço: produto vendido no mês com custo cadastrado e margem abaixo de 20% do preço (mesma regra de Insights); mostra o de menor margem. Sem produto assim, o cartão não aparece.
- Compromissos da agenda são exibidos separadamente, descontam deposit e excluem os que têm saleId para evitar dupla contagem.

## Error Handling

Ausência sem erro é carregamento; ausência com erro é indisponibilidade. Dados em cache com falha são preservados com aviso e repetição. Zero só é apresentado a partir de dados retornados (exceção: prévia esmaecida de quem ainda não vendeu, rotulada). Meta indisponível não se transforma em convite para criar outra.

## Performance

Cache compartilhado por prefixo. Histórico limitado ao mês atual e ao anterior. Totais de recebimento não usam só a primeira página. Dados de toda a conta são necessários para soma; considerar agregação no servidor se volume justificar.

## Test matrix

Testes de domínio: regra de fase e limiar, passos, saudação, lucro estimado completo/parcial, sequência (hoje/ontem/quebra), dias ativos, comparação no mesmo período, semana e melhor dia, campeões, clientes que voltaram, ritmo da meta, alerta de preço, estados desconhecido/erro/cache/zero, prazos, recebimentos e alertas de estoque. Testes de hooks: paginação e falha intermediária (pendentes e histórico). Testes de componentes: carregamento sem R$ 0,00, erro, cache, meta indisponível e fiado total de todas as páginas.

## Examples

Conta nova com produto cadastrado: fase 1, "1 de 3", passo "Descobrir o preço certo" com "Calcular agora". Primeira venda de 12 com custo 6,60: fase 2 e "deixou R$ 5,40". Venda em 7 dias diferentes: fase 3. Vendas de 1 a 23 de setembro somando 1.120 contra 1.000 de 1 a 23 de agosto: "12% a mais que agosto". Brigadeiro a 3,50 com custo 2,95: alerta "Hora de rever o preço do Brigadeiro".

## Change log / Decisions

2026-09-23: Início redesenhado em três fases (design A vinho). Retirados ações rápidas e cartão Dinheiro; agenda e estoque ficam abaixo. Selo "Dados de exemplo" dos mockups não foi implementado (é anotação de protótipo). Alerta de aumento de insumo não implementado por falta de consulta; o alerta usa margem abaixo de 20%.

2026-09-22: a navbar compartilhada passou a cinco colunas iguais. Destinos usam ícone outline/fill conforme o estado; a ação central mostra `Vender` (leitor de tela `Nova venda`) num poço de 40 dp. Rótulos têm 16 px. A reserva de altura acompanha o poço e a escala de fonte em `shared/layout/floating-tab-bar.ts`.

2026-09-10: implementadas todas as prioridades aprovadas de conteúdo e clareza da home. Textos refletem o cálculo existente da meta por entradas.
