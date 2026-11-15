# Início: primeiros passos, dia e mês

## Purpose

A tela Início muda conforme o momento da conta, em três fases (design "A", versão vinho, escolhido pelo dono em 2026-09-23):

1. **Primeiros passos** (`setup`): lista de três passos (produto, preço, primeira venda) com progresso e a ação do passo atual.
2. **Tudo pronto** (`ready`): faixa vinho "Tudo pronto, {nome}!" com o lucro da primeira venda, passos marcados, cartão de sequência (N de 7 dias), "Seu dia em números" e sugestões "Quando quiser, dá para ir além".
3. **Mês em uso** (`month`): destaque vinho "{Mês} até hoje" (vendi, sobrou no bolso, comparação com o mês anterior, barras da semana e melhor dia), cartão de sequência e meta, "Campeões do mês", "Fiado para receber" e, quando os dados sustentam, alerta de preço.

Nas fases 2 e 3 também aparecem, quando há o que mostrar, dois cartões de rotina: **Datas que vendem** (próxima data comercial) e **Clientes que sumiram** (clientes de costume sem comprar há 30+ dias, com WhatsApp).

## Non-goals

Não calcular lucro contábil, enviar cobranças, mudar permissões, criar uma agenda paralela ou alterar regras financeiras do servidor. Não cria meta semanal (só existe a meta mensal de retirada). Não mostra alerta de aumento de insumo (não há consulta de histórico de custo no Início).

## Boundaries & Ownership

A rota `app/tabs/index.tsx` mantém autenticação, orientação inicial, decisão de fase e composição. Home apresenta dados; Agenda, Produtos, Precificação, Fiado, Catálogo e Financeiro mantêm formulários e detalhes. Home lê clientes só pela função pública `fetchAllClients` de `clients/api` (mesmo padrão de `sales/api` e `products/api` em `hooks.ts`). `business-profile.tsx` continua no fim da página (compacto após a primeira venda).

## Code pointers

- `domain.ts`: `homePhase` e `HOME_HISTORY_DAYS_FOR_MONTH`, passos, saudação, lucro estimado de venda, sequência, dias com venda, mês até hoje e comparação, semana, melhor dia da semana, campeões, clientes que voltaram, ritmo da meta, alerta de preço, estados de consulta, compromissos, recebimentos e alertas de estoque.
- `hooks.ts`: vendas pendentes paginadas, histórico de vendas desde o início do mês anterior (todas as páginas), produtos completos e `useHomeLapsedClientsData` (vendas dos últimos 180 dias + a lista inteira de clientes).
- `seasonal-dates.ts`: datas comerciais (Páscoa calculada, Mães/Pais no 2º domingo, Black Friday, datas fixas), janela de aviso, título e leitura das datas dispensadas.
- `use-seasonal-dismissals.ts`: datas dispensadas por usuário em `asyncStorage` (`home-seasonal-dismissed:v1:{userId}`, lista JSON de chaves `natal-2026`), leitura e escrita em try/catch.
- `lapsed-clients.ts`: seleção de clientes que sumiram, rótulo "Última compra há N dias" e mensagem pronta do WhatsApp.
- `components/`: `setup.tsx` (`HomeSetupSteps`, `HomeSetupTip`), `day-numbers.tsx` (`HomeDayPreview`, `HomeDayNumbers`), `ready.tsx` (`HomeReadyBanner`, `HomeStreakCard`, `HomeNextIdeas`), `month.tsx` (`HomeMonthHero`, `HomeHabitGoal`, `HomeChampions`, `HomeFiado`, `HomePriceAlert`), `agenda.tsx` (`HomeDay`, `HomeAttention`), `seasonal.tsx` (`HomeSeasonalCard`), `lapsed-clients.tsx` (`HomeLapsedClients`), `parts.tsx` (cartão, botões, avisos de consulta) e `styles.ts` (escala do mockup: títulos 17–40 px, corpo 16 px, legendas 13–15 px).
- `../../shared/brand-palette.ts`: tokens vinho/lima/rosa usados nos destaques (`wineFill`, `lime`, `rose`, `onWineMuted`, `wineBar`, `wineDivider`).
- `../../app/tabs/agenda.tsx`: parâmetros `orderId` e `create=home`.
- `../../app/products.tsx`: parâmetro `productId`.
- `../../app/catalog.tsx`: destino de "Divulgar catálogo" (`/catalog`, onde o link já é compartilhado).
- `../../shared/utils/whatsapp.ts`: `openWhatsApp` (valida e normaliza o telefone para o wa.me).

## Components

Fase decidida por `homePhase`; enquanto qualquer entrada da regra carrega, a tela mostra só o cabeçalho e "Carregando seu Início…"; se falha sem cache, mostra aviso com nova tentativa.

- **Primeiros passos**: anel "N de 3", título "Falta pouco para ver seu lucro", passos com concluído riscado, passo atual destacado com botão (Cadastrar produto / Calcular agora / Anotar venda). Sem venda, "Seu dia em números" aparece esmaecido com "aparece depois da 1ª venda" (zero verdadeiro, não carregamento). No computador, cartão "Por que o preço primeiro?" com exemplo fixo marcado "Exemplo".
- **Tudo pronto**: faixa vinho com selo lima. Com uma venda: "Sua primeira venda deixou {lucro} no seu bolso"; com mais: "Suas vendas já deixaram {lucro} no seu bolso"; sem custo cadastrado, mostra o valor vendido. Botão "Anotar outra venda" só no celular (no computador a barra lateral já tem Nova venda). Cartão de sequência "Seu 1º dia anotando" / "{N} dias anotando", 7 segmentos, "N de 7 dias". "Seu dia em números": vendido hoje, lucro hoje, fiado a receber e a última venda. Sugestões: cadastrar mais produtos, definir a meta do mês, montar catálogo.
- **Mês em uso**: destaque vinho com vendi (branco) e sobrou no bolso (lima); pílula lima quando cresce, neutra quando cai; barras seg–dom da semana atual com hoje em lima; "{Dia} é o seu melhor dia". Celular mostra "Anotar venda" abaixo do destaque. Cartão de sequência e meta (no computador também vendas no mês e clientes que voltaram). Campeões do mês (até 3, por lucro estimado), Fiado para receber (até 2 clientes, total de todas as páginas, "Cobrar pelo WhatsApp" abre `/fiado`, onde a cobrança já existe) e alerta de preço.
- **Anotar falando** (`HomeVoiceEntry`, fases 2 e 3, celular e computador): cartão "Qual venda você fez hoje?" com campo (abre `/assistant`) e botão "Falar" (abre `/assistant?falar=1`, que já começa a gravar se o aparelho grava). No Gratuito mostra "Restam N usos de teste"; some quando `usageExhausted` (a API decide o saldo).
- **Datas que vendem** (`HomeSeasonalCard`, fases 2 e 3; celular logo após "Anotar falando", computador após o destaque): selo "DATAS QUE VENDEM", título "Faltam N dias para {o Natal}" / "Falta 1 dia para…" / "Hoje é {Natal}!", uma dica curta da data e dois botões: "Anotar encomenda" (serviço: "Agendar atendimento"; abre `/tabs/agenda?create=home`, só quando a marca tem `agendamento`) e "Divulgar catálogo" (abre `/catalog`). "Esconder este aviso" dispensa só aquela data (chave `{id}-{ano}`); a próxima data da janela, se houver, aparece no lugar. Não aparece até as datas dispensadas serem lidas, nem fora da janela.
- **Clientes que sumiram** (`HomeLapsedClients`, fases 2 e 3; fase 3 abaixo de Campeões/Fiado/Preço, fase 2 antes das sugestões): até 3 linhas com inicial, nome, "Última compra há N dias" e botão "WhatsApp" que abre a conversa com mensagem pronta (primeiro nome, "Aqui é da {nome do negócio}." quando o perfil tem, e "Quer fazer um pedido esta semana?" ou, para serviço, "Quer agendar um horário esta semana?"). Por ser convite e não valor, não ocupa espaço enquanto carrega, se falhar ou se ninguém sumiu.
- Agenda (`HomeDay`, com o valor previsto na agenda) e estoque baixo (`HomeAttention`) continuam abaixo das seções da fase 2 e 3. Ações rápidas, seletor Hoje/Mês e cartão Dinheiro foram retirados: tab bar, barra lateral e botões de venda cobrem as ações.

## Hooks

useHomeLapsedClientsData(dateFrom, enabled) faz duas consultas habilitadas só nas fases 2 e 3: `["sales", "home-lapsed", dateFrom]` (todas as páginas de `GET /sales` desde 180 dias atrás, meia-noite local) e `["clients", "home-lapsed"]` (`fetchAllClients`). Os prefixos recebem as invalidações existentes de vendas e clientes. useSeasonalDismissals(userId, now) lê e grava as datas dispensadas no `asyncStorage`.

useHomePendingSales percorre todas as páginas; qualquer falha impede apresentar um total parcial. useHomeSalesHistory busca todas as páginas de `GET /sales` com `dateFrom` no início do mês anterior (horário local); falha em qualquer página rejeita. useHomeProducts reutiliza fetchAllProducts. Prefixos de cache sales/products recebem invalidação das operações existentes. useOrders aceita enabled para não consultar agenda desabilitada pela marca.

## API Integration

Somente consultas existentes de sales, finance, insights, goals, orders, products, clients (`GET /clients`, todas as páginas) e a lista de precificações já usada. Nenhum novo endpoint ou migração: a API não devolve última compra por cliente, então "Clientes que sumiram" cruza no app a lista de clientes com as vendas dos últimos 180 dias. `GET /sales` passa a receber do app os filtros `dateFrom`/`dateTo` que a API já aceitava. Chamadas seguem apiClient autenticado. O servidor continua responsável pela autorização.

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
- Datas que vendem: Páscoa (domingo, algoritmo de Meeus), Dia das Mães (2º domingo de maio), Dia dos Namorados (12/06), Dia dos Pais (2º domingo de agosto), Dia do Cliente (15/09), Dia das Crianças (12/10), Black Friday (sexta depois da 4ª quinta de novembro) e Natal (25/12). Janela: de 30 dias antes (Natal: 45) até o próprio dia, em dias de calendário locais; olha o ano atual e o próximo. Mostra a mais próxima não dispensada. Chaves dispensadas de anos anteriores ao passado são descartadas na leitura.
- Clientes que sumiram: vendas não canceladas (pagas e fiado) dos últimos 180 dias com cliente; pelo menos 2 compras no período; última compra há 30 dias ou mais (dias de calendário); telefone válido (`isValidBrazilPhone`). Ordem: maior gasto no período primeiro (quem vale mais trazer de volta); empate, há mais tempo sem comprar; depois o nome. Máximo 3.
- Compromissos da agenda são exibidos separadamente, descontam deposit e excluem os que têm saleId para evitar dupla contagem.

## Error Handling

Ausência sem erro é carregamento; ausência com erro é indisponibilidade. Dados em cache com falha são preservados com aviso e repetição. Zero só é apresentado a partir de dados retornados (exceção: prévia esmaecida de quem ainda não vendeu, rotulada). Meta indisponível não se transforma em convite para criar outra.

## Performance

Cache compartilhado por prefixo. Histórico limitado ao mês atual e ao anterior. Clientes que sumiram carrega 180 dias de vendas e a lista inteira de clientes só nas fases 2 e 3; se o volume pesar, trocar por agregação no servidor (última compra, quantidade e total por cliente). Totais de recebimento não usam só a primeira página. Dados de toda a conta são necessários para soma; considerar agregação no servidor se volume justificar.

## Test matrix

Testes de domínio: regra de fase e limiar, passos, saudação, lucro estimado completo/parcial, sequência (hoje/ontem/quebra), dias ativos, comparação no mesmo período, semana e melhor dia, campeões, clientes que voltaram, ritmo da meta, alerta de preço, estados desconhecido/erro/cache/zero, prazos, recebimentos e alertas de estoque. Testes de hooks: paginação e falha intermediária (pendentes e histórico). Testes de componentes: carregamento sem R$ 0,00, erro, cache, meta indisponível e fiado total de todas as páginas.

`seasonal-dates.test.ts`: Páscoa 2019, 2024 a 2028 e 2038, Black Friday 2024 a 2028, 2º domingo de maio e agosto, lista do ano em ordem, 15/11/2026 escolhe Black Friday (12 dias) com Natal (40) na janela, dispensar passa para a próxima, todas dispensadas = nada, borda de 30 dias (abre em 30, não em 31), Natal com 45, próprio dia ("Hoje é Natal!") e dia seguinte, virada de ano (Páscoa do ano seguinte), singular "Falta 1 dia", período sem data, leitura das dispensadas (inválidas e anos antigos). `components/seasonal.test.tsx`: atalhos e destinos, sem agenda sem botão, dispensar grava e mostra a próxima, data dispensada antes não volta.

`lapsed-clients.test.ts`: cliente com 2 compras e última há 45 dias, borda 30/29 dias, cancelada e venda sem cliente não contam, fiado conta, sem telefone válido fica fora, ordem por gasto e depois tempo sem comprar com limite 3, compra recente esconde, início do período (180 dias, meia-noite local), rótulo e mensagens (com e sem nome do negócio, serviço). `components/lapsed-clients.test.tsx`: linha e WhatsApp com mensagem, nada enquanto carrega, com erro ou sem ninguém.

## Examples

Conta nova com produto cadastrado: fase 1, "1 de 3", passo "Descobrir o preço certo" com "Calcular agora". Primeira venda de 12 com custo 6,60: fase 2 e "deixou R$ 5,40". Venda em 7 dias diferentes: fase 3. Vendas de 1 a 23 de setembro somando 1.120 contra 1.000 de 1 a 23 de agosto: "12% a mais que agosto". Brigadeiro a 3,50 com custo 2,95: alerta "Hora de rever o preço do Brigadeiro".

## Change log / Decisions

2026-11-15: cartão **Clientes que sumiram** nas fases 2 e 3: até 3 clientes com 2+ compras nos últimos 180 dias e última compra há 30+ dias, com botão "WhatsApp" e mensagem pronta. Ordenado por quem mais gastou no período (empate: há mais tempo sem comprar). Sem mudança de API: usa `GET /clients` e `GET /sales?dateFrom` existentes. Título neutro "Clientes que sumiram" (cliente pode ser homem ou mulher).

2026-11-15: cartão **Datas que vendem** nas fases 2 e 3: próxima data comercial na janela (30 dias antes; Natal 45), dica curta, "Anotar encomenda" (só com agenda na marca) e "Divulgar catálogo". Dispensa por data salva no aparelho. Lista curta de 8 datas; Carnaval e Dia da Mulher ficaram de fora de propósito.

2026-09-24: no desktop, a linha Campeões / Fiado / Preço quebra quando cada cartão ficaria com menos de 300 px (1024 px: dois lado a lado e o alerta de preço abaixo, na largura toda), para os nomes não serem cortados.

2026-09-24: no desktop, os dias da semana do painel vinho e o "de lucro" dos campeões do mês usam 14 px (`styles.captionDesk`); no celular continuam com 13 px.

2026-09-23: Início redesenhado em três fases (design A vinho). Retirados ações rápidas e cartão Dinheiro; agenda e estoque ficam abaixo. Selo "Dados de exemplo" dos mockups não foi implementado (é anotação de protótipo). Alerta de aumento de insumo não implementado por falta de consulta; o alerta usa margem abaixo de 20%.

2026-09-22: a navbar compartilhada passou a cinco colunas iguais. Destinos usam ícone outline/fill conforme o estado; a ação central mostra `Vender` (leitor de tela `Nova venda`) num poço de 40 dp. Rótulos têm 16 px. A reserva de altura acompanha o poço e a escala de fonte em `shared/layout/floating-tab-bar.ts`.

2026-09-10: implementadas todas as prioridades aprovadas de conteúdo e clareza da home. Textos refletem o cálculo existente da meta por entradas.

2026-09-29: cartão do Anotar falando no Início (opção A escolhida por LUCAS entre cartão, dois botões, barra no topo e faixa vinho).
