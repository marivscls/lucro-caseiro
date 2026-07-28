# PRD — Operação acionável e redesign responsivo do Lucro Caseiro

**Status:** aprovado para implementação
**Data:** 2026-07-24
**Produto:** Lucro Caseiro — Android e PWA
**Responsável:** Produto e Engenharia
**Documento relacionado:** `.aerofortress/specs/design-inspiracoes-operacionais.md`
**Mockups canônicos:** `.aerofortress/specs/mockups-operacao-acionavel.md`

## 1. Resumo executivo

O Lucro Caseiro já cobre o ciclo custo → produto → venda, mas parte da operação ainda exige
interpretação manual, navegação excessiva ou uso de telas desenhadas primeiro para celular e apenas
alargadas no PWA. Este projeto transforma os módulos existentes em uma experiência operacional
acionável: alertas levam a uma ação, vendas mostram a composição do total, estoque pode ser reposto
sem editar o cadastro inteiro, agenda representa disponibilidade de serviços, Insights responde
perguntas concretas e o PWA ganha composição própria para trabalho em telas maiores.

O projeto também cria a base de dados necessária para custo previsto × realizado, desperdício,
promoções temporárias, próximo contato com clientes e catálogo aprimorado.

Não será criado um ERP, banco, CRM, marketplace ou chat genérico. O produto continua centrado em
precificação, produtos/serviços, venda, agenda e dinheiro do negócio.

## 2. Problema

1. O Financeiro mostra resultados, mas ainda não reúne obrigações vencidas e alertas de desvio.
2. A venda aceita observações no contrato, porém a interface não as coleta; também não existe
   desconto explícito nem composição subtotal → desconto → total.
3. A reposição exige abrir a edição completa do produto e não existe histórico simples de estoque.
4. A experiência web não oferece uma visão operacional densa e legível de vendas e encomendas.
5. A Agenda organiza encomendas, mas não representa serviços, duração ou horários livres.
6. Insights mostra métricas, mas não responde diretamente às decisões diárias.
7. Orçamentos não mostram internamente custo, ganho e margem.
8. Produção não registra consumo real e perdas; por isso não pode comparar previsto × realizado.
9. Promoções existentes no domínio de varejo não estão disponíveis em uma forma adequada ao Lucro
   Caseiro.
10. O layout atual ainda não prova uma transformação visual consistente em mobile, tablet e desktop.

## 3. Objetivos

- Reduzir o caminho entre identificar um problema e executar a ação correspondente.
- Tornar subtotal, desconto, total, recebido e a receber semanticamente inequívocos.
- Permitir que o PWA seja o canal principal de trabalho para quem não usa Android.
- Dar suporte real a negócios de produtos e de serviços sem misturar seus fluxos.
- Produzir Insights exclusivamente a partir de dados observados.
- Tornar as mudanças visualmente perceptíveis e rastreáveis às referências aprovadas.

## 4. Não objetivos

- Conta bancária, carteira, cartões armazenados, transferências ou investimentos.
- CRM B2B, funil comercial, gestão de funcionários ou automação de marketing.
- Marketplace, mapas, distância, avaliações, contratação de terceiros ou videochamada.
- Rastreamento logístico completo, dropshipping ou integrações com marketplaces.
- Chat de IA genérico, avatar/orbe de IA ou respostas sem evidência.
- Dark mode, glassmorphism ou dashboard corporativo denso como identidade principal.
- Tratar entrega como pagamento. `done` pertence à encomenda; `paid` pertence à venda/recebimento.
- Criar um produto separado para tablet.

## 5. Princípios de produto

1. **Indicador → explicação → ação.** Nenhum alerta termina em informação passiva.
2. **Uma fonte de verdade.** Reutilizar Compras, Vendas, Encomendas, Produtos, Receitas, Clientes,
   Orçamentos e Promoções existentes.
3. **Sem precisão inventada.** Custo realizado e desperdício só aparecem após fechamento real.
4. **Pagamento ≠ entrega.** Recebido usa valores pagos/sinais; entrega usa status da encomenda.
5. **Progressive disclosure.** A tela mostra primeiro a decisão; detalhes ficam disponíveis sob ação.
6. **Paridade funcional.** Android e PWA realizam os mesmos fluxos; a composição pode mudar.

## 6. Escopo funcional — entrega principal

### 6.1 Financeiro realmente acionável

#### Requisitos

- Mostrar compras pendentes vencidas e a vencer nos próximos sete dias.
- Permitir marcar uma compra específica como paga a partir do alerta, com trava por ID e confirmação
  da resposta.
- Detectar despesas acima do padrão usando uma regra determinística:
  - comparar cada despesa com a mediana das despesas do período selecionado;
  - exigir pelo menos quatro despesas como amostra;
  - alertar somente a partir de duas vezes a mediana;
  - informar o valor observado e a base de comparação.
- Mostrar orçamentos que vencem nos próximos sete dias e orçamentos expirados ainda abertos.
- Cada alerta deve abrir o registro ou filtro correspondente.
- Manter os filtros Hoje / 7 dias / Mês e a comparação entradas × saídas.

#### Aceite

- Nenhum alerta aparece sem dados suficientes.
- Marcar uma compra como paga atualiza apenas a compra escolhida e o caixa correspondente.
- Um orçamento aceito, recusado ou convertido não aparece como pendência.

### 6.2 Venda mais completa

#### Requisitos

- Expor o campo de observações já suportado pelo contrato.
- Permitir desconto manual em reais ou porcentagem.
- Validar desconto maior que zero e menor que o subtotal.
- Mostrar subtotal, desconto e total na etapa de revisão, no detalhe e no recibo.
- Preservar cliente → produtos → pagamento → revisão.
- Preservar pagamento imediato ou receber depois.
- Não adicionar status “Entregue” à venda.

#### Aceite

- O backend recalcula e persiste o total; o cliente não é autoridade financeira.
- Editar/cancelar uma venda mantém estoque, caixa e desconto consistentes.
- Recibo e compartilhamento exibem a composição do valor.

### 6.3 Estoque operacional

#### Requisitos

- Ação rápida “Adicionar estoque” no card/detalhe do produto.
- Ajuste positivo ou negativo com quantidade, motivo opcional e data.
- Histórico simples por produto: venda, compra, ajuste, cancelamento e composição.
- Filtros: todos, sem estoque, estoque baixo, venda rápida e venda lenta.
- Filtro por categoria e ordenação por nome, estoque e vendas.
- “Venda rápida/lenta” usa janela móvel e amostra mínima explicitadas no domínio.

#### Aceite

- Toda alteração de estoque gera movimento auditável na mesma transação.
- Produtos sem controle de estoque não aparecem nos filtros de reposição.
- Variações preservam o saldo da variação escolhida.

### 6.4 Visão web de vendas e encomendas

#### Requisitos

- Desktop: tabela com cliente, data, valor, pagamento, entrega e ações.
- KPIs: vendas do período, recebido, a receber e encomendas em aberto.
- Filtros por período, pagamento, entrega, cliente e busca.
- Ações por linha: abrir, compartilhar, marcar pago, editar/cancelar quando permitido.
- Mobile mantém cards; tablet usa composição adaptativa conforme espaço.

#### Aceite

- Não renderizar a lista mobile apenas com largura maior.
- Cabeçalho e filtros permanecem utilizáveis em 768, 1024 e 1440 px.

### 6.5 Agenda para serviços

#### Requisitos

- Cadastro simples de serviço: nome, duração, preço padrão e ativo.
- Encomenda/atendimento pode referenciar um serviço.
- Mostrar faixa semanal e linha do tempo do dia.
- Calcular horários livres e ocupados a partir da duração e dos compromissos ativos.
- Criar atendimento escolhendo serviço, cliente, data e horário.
- Remarcar e enviar lembrete contextual pelo WhatsApp.
- Exibir apenas quando `agendamento` estiver habilitado; campos de serviço aparecem para perfis que
  trabalham com serviços/beleza ou optarem por usar a Agenda dessa forma.

#### Aceite

- Compromissos cancelados não bloqueiam horário.
- Conflitos de horário são rejeitados no servidor.
- O usuário pode manter encomendas sem serviço; a migração é compatível.

### 6.6 Coach nos Insights

#### Requisitos

- Bloco “O que fazer agora” com até três ações priorizadas.
- Perguntas sugeridas:
  - O que devo repor?
  - Onde estou perdendo margem?
- Respostas determinísticas, citando os registros usados e abrindo a ação correspondente.
- Estados “Atenção”, “Oportunidade” e “Tudo certo”.
- Sem campo de chat livre nesta versão.

#### Aceite

- Cada resposta tem fonte de dados, período e ação.
- Ausência de dados gera orientação de cadastro, nunca uma conclusão fictícia.

### 6.7 Orçamento com visão interna de lucro

#### Requisitos

- Item do orçamento pode referenciar um produto, preservando nome/preço como snapshot.
- Armazenar custo estimado interno por item.
- Permitir desconto em reais ou porcentagem.
- Mostrar internamente custo estimado, ganho e margem.
- Documento do cliente mostra apenas itens, subtotal, desconto e total.
- Alertar validade próxima e expiração.
- Preservar Rascunho → Enviado → Aprovado/Recusado → Encomenda.

#### Aceite

- Custo e margem nunca aparecem no PDF/mensagem do cliente.
- Alterar o custo do produto depois não reescreve o snapshot do orçamento.

## 7. Escopo funcional — base ampliada

### 7.1 Fechamento de produção

- Registrar produto/receita, quantidade planejada, quantidade produzida e data.
- Permitir selecionar os materiais previstos; receita/ficha técnica continua opcional nesta base.
- Registrar quantidades realmente utilizadas e perdas.
- Calcular custo previsto, realizado, diferença absoluta/percentual e desperdício.
- Atualizar estoque somente quando o usuário confirmar o fechamento.
- Insights de custo real só usam produções fechadas.

### 7.2 Promoções com período

- Reutilizar o domínio de promoções existente.
- Expor no Lucro Caseiro somente nome, tipo de desconto, valor, produtos/categoria, início, fim e
  ativo.
- Não misturar a tela operacional de varejo/papelaria.
- Nesta entrega, expor cadastro e gestão. Aplicação automática em venda fica fora até existir uma
  regra comercial explícita para conflito com o desconto manual.

### 7.3 Próximo contato com cliente

- Campo opcional de data, motivo e observação.
- Lista de contatos de hoje/atrasados em Home e Insights.
- Ação abre WhatsApp ou detalhe do cliente.
- Sem pipeline, estágio comercial ou pontuação de lead.

### 7.4 Catálogo aprimorado

- Busca permanente, chips por categoria e ordenação.
- Detalhe rico com galeria, descrição, variações, preço e CTA.
- Layout editorial; sem mapa, avaliação ou aparência de marketplace.
- Coleções ficam fora até existir uso real comprovado.

## 8. Modelo de dados proposto

### Alterações compatíveis

- `sales`: `subtotal`, `discount`, `discount_type`, `discount_value`.
- `sale_items`: manter snapshot de preço e subtotal; desconto agregado na venda.
- `stock_movements`: produto/variação, tipo, quantidade, motivo, origem, saldo e data.
- `services`: nome, duração, preço padrão, ativo e usuário.
- `orders`: `service_id`, `duration_minutes`.
- `quotes`: `subtotal`, `discount`, `discount_type`, `discount_value`, `estimated_cost`.
- itens JSON do orçamento: `productId?`, `estimatedUnitCost?`.
- `production_runs`: planejado, produzido, custo previsto/realizado, perdas, status e timestamps.
- `production_run_items`: material, previsto, realizado, perda e custo.
- `clients`: próximo contato, motivo e observação.

### Regras de migração

- Novas colunas financeiras recebem defaults neutros (`subtotal = total`, `discount = 0`).
- Dados históricos continuam válidos.
- Nenhuma migração altera status de pagamento ou entrega.
- Promoções reutilizam `retail_promotions`; a rota do Lucro Caseiro expõe apenas o subconjunto
  permitido.

## 9. Direção visual

### Identidade canônica

- Fraunces em display/h1/h2; Nunito Sans em textos, controles e números.
- Fundo neutro quente e paleta rosa oficial.
- No máximo uma ação preenchida de rosa por viewport.
- Cards opacos, flat, com borda hairline e raios dos tokens.
- Verde: dinheiro positivo; âmbar: atenção; vermelho: problema.
- Sem glassmorphism, excesso de gradientes ou densidade corporativa.

### Por superfície

| Superfície | Mobile | Desktop/PWA |
| --- | --- | --- |
| Home | “Hoje”, alertas e ações em ordem vertical | duas colunas reais por prioridade |
| Venda | stepper compacto, total fixo, revisão como recibo | seleção e resumo lado a lado |
| Produtos | busca fixa, chips, cards escaneáveis e reposição | grid/tabela adaptativa e painel de detalhe |
| Financeiro | resumo, fluxo, alertas e movimentos | indicadores/alertas ao lado do histórico |
| Orçamento | formulário e revisão em tela cheia | formulário à esquerda, prévia à direita |
| Agenda | semana + linha do tempo | calendário/linha do tempo e detalhe lado a lado |
| Insights | até três decisões prioritárias | cards e evidências em grid moderado |
| Vendas | cards | tabela operacional |
| Catálogo | foto, nome, preço e CTA | grade editorial com detalhe rico |

### Referências

- StockIt/KYROBAR → Produtos e Estoque.
- Transactions/Lightweight Finance → Financeiro.
- Ecomiq → Venda e Produto.
- Invoice Maker/Flowly → Orçamentos.
- Beauty Booking/Travel Itinerary → Agenda.
- Business Analytics → Insights.
- Motoserv → operação no desktop.

## 10. Estados obrigatórios

Cada superfície deve cobrir:

- carregando;
- vazio com orientação;
- erro recuperável;
- dados normais;
- atenção/pendência;
- restrição de plano quando aplicável;
- mobile 390×844;
- tablet 768×1024 e 1024×768;
- desktop 1440×1000.

## 11. Métricas

- Percentual de alertas que resultam em ação.
- Tempo venda iniciada → registrada.
- Uso de desconto e diferença média entre subtotal e total.
- Ajustes de estoque feitos sem abrir edição completa.
- Compras vencidas quitadas pelo Financeiro.
- Atendimentos criados/remarcados.
- Orçamentos enviados, aceitos e convertidos.
- Perguntas sugeridas abertas e ações concluídas.
- Produções fechadas com custo real informado.

## 12. Segurança e integridade

- Totais e margens são calculados no servidor.
- Alterações financeiras/estoque são transacionais e auditáveis.
- Ações em listas usam trava síncrona por registro e confirmam o ID retornado.
- Custos internos nunca aparecem em documentos do cliente.
- Consultas e mutations sempre restringem por `user_id`.
- Desconto nunca torna o total zero ou negativo.

## 13. Estratégia de entrega

1. PRD, contratos e migrations.
2. Financeiro, venda, estoque e orçamento.
3. Tabela web e Agenda de serviços.
4. Coach determinístico e catálogo.
5. Fechamento de produção, promoções e próximo contato.
6. Redesign final, estados e provas visuais.

As migrations serão criadas localmente, mas só poderão ser aplicadas a banco externo com autorização.

## 14. Critérios globais de aceite

1. TypeScript, lint, testes e build PWA passam.
2. Migrations têm caminho de dados históricos e testes de domínio.
3. Fluxos críticos têm pelo menos um teste determinístico.
4. Capturas reais existem em mobile, tablet e desktop.
5. Cada referência adotada tem comparação lado a lado e decisão registrada.
6. Não há status, métrica ou insight produzido sem dados observados.
7. O PWA não depende de APIs nativas sem fallback web.
8. O resultado é perceptivelmente diferente nas nove superfícies, não apenas no código.

## 15. Definição de pronto

O projeto só está concluído quando a funcionalidade, o layout, os estados, a responsividade e a prova
visual estiverem presentes. Compilar, responder HTTP 200 ou montar uma tela com API simulada não
substitui a validação autenticada; bloqueios externos devem permanecer explicitamente registrados.

## 16. Implementação observada em 2026-07-24

| Área | Resultado implementado | Evidência principal |
| --- | --- | --- |
| Financeiro | contas vencidas/a vencer, pagamento por registro, orçamento vencendo, anomalia determinística, entradas × saídas | `features/finance/components/finance-dashboard.tsx` |
| Venda | observações, desconto em valor/percentual, subtotal/desconto/total e recibo; sem status de entrega | `app/tabs/new-sale.tsx`, `features/sales/receipt.ts` |
| Estoque | reposição rápida, filtros/ordenação, velocidade e movimentos de venda, compra, ajuste, cancelamento e produção | `app/products.tsx`, API `features/products`, `features/sales` e `features/purchases` |
| Vendas web | KPIs, tabelas distintas de vendas/encomendas, busca, filtros e ações; cards preservados no mobile | `app/tabs/sales.tsx` |
| Agenda | serviços, duração, conflito no servidor, faixa semanal, linha do tempo livre/ocupado, remarcação e lembrete | `app/tabs/agenda.tsx`, API `features/orders` |
| Insights | até três decisões e perguntas de reposição/margem | `app/insights.tsx`, `features/insights/domain.ts` |
| Orçamento | custo/ganho/margem internos, desconto, validade, revisão e documento comercial sem custos | `features/quotes/components/quote-form.tsx` |
| Produção | backend transacional preservado; tela mobile retirada por decisão de produto em 2026-07-25 | API `features/production` |
| Promoções | gestão com produto/categoria, valor/tipo e vigência reutilizando o núcleo de varejo | `app/promotions.tsx`, rota `/api/v1/promotions` |
| Clientes | próximo contato, motivo/observação e lista de contatos de hoje/atrasados na Home | `features/clients/components/edit-client-form.tsx`, `app/tabs/index.tsx` |
| Catálogo | busca, categoria, ordenação, cards editoriais, descrição/variações, CTA e estados vazio/erro | API `features/catalog/catalog.domain.ts` |

### Prova técnica e visual

- TypeScript: 7 tarefas passaram.
- Lint: passou sem erros; a API mantém 25 avisos de segurança já catalogados.
- Testes: API 656, mobile 378 e web 9 — 1.043 no total.

## 17. Decisão posterior — retirada da tela de Produção

Em 2026-07-25, a tela de fechamento de Produção foi retirada do aplicativo por decisão da dona do
produto. O preenchimento de planejado, produzido, consumo e perda de cada insumo adicionava um ritual
manual desproporcional ao valor entregue e aproximava o Lucro Caseiro de uma operação industrial.

A rota, o item do menu Mais, o cliente mobile e o alerta correspondente de Insights foram removidos.
A API, os contratos e as tabelas permanecem preservados, sem migração destrutiva, para manter a
integridade de dados já registrados e permitir reavaliação futura somente se houver demanda validada.
- Context lint: API e mobile passaram.
- Build PWA Lucro Caseiro: passou.
- Capturas de dados: mobile, tablet retrato, tablet paisagem e desktop.
- Capturas de vazio/erro: mobile e desktop, incluindo o catálogo público.
- Estados internos adicionais: seleção de venda, revisão de orçamento, formulário desktop,
  linha do tempo da Agenda, Encomendas desktop, ações dos Insights e edição de produto.
- Artefatos: `.aerofortress/tmp/design-audit/`.

### Bloqueios externos preservados

- As migrations `042_quote_lifecycle.sql` e `043_operational_actionability.sql` foram criadas, mas
  não aplicadas em banco externo.
- A conta E2E real continua recusando o login com HTTP 400. A prova visual usa o PWA compilado e
  respostas locais simuladas; não é apresentada como validação autenticada da conta real.
