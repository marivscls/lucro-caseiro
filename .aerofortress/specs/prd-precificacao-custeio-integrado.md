# PRD — Precificação com custeio integrado e preços por canal

**Status:** publicado em produção
**Data:** 2026-08-08
**Produto:** Lucro Caseiro — Android e PWA
**Responsável:** Produto e Engenharia
**Referências:** análise observada do FoodWise e regras canônicas de confiança da Precificação

## 1. Resumo executivo

O Lucro Caseiro já registra gastos recorrentes, faturamento, meta de pró-labore, receitas,
embalagens e cálculos de precificação. Apesar disso, a Precificação Completa ainda pede que a pessoa
redigite gastos mensais, estime produção e some taxas de canais em cada cálculo.

Esta entrega conecta as fontes existentes sem criar um segundo cadastro de custeio. A pessoa poderá
selecionar gastos recorrentes ativos, escolher uma base explícita de faturamento e aplicar uma taxa
de custos indiretos ao preço. Também poderá salvar perfis alternativos de venda, como iFood, cartão
ou marketplace, e calcular o preço adequado para um canal por vez.

Nenhuma sugestão será aplicada automaticamente. Toda premissa mostrará sua origem, valor e fórmula,
e exigirá uma ação explícita antes de entrar no cálculo.

## 2. Problema

1. Gastos Fixos e Precificação são fontes separadas; a pessoa cadastra o mesmo total mais de uma vez.
2. O rateio atual divide gastos mensais por unidades produzidas, o que pressupõe produtos homogêneos
   e exige uma produção mensal estimada.
3. Negócios com produtos de preços e complexidades diferentes precisam distribuir custos indiretos
   proporcionalmente à receita, não igualmente por unidade.
4. Faturamento real e meta de pró-labore já existem, mas não são oferecidos como bases rastreáveis.
5. iFood e cartão são somados como se sempre incidissem juntos; não há perfis alternativos por canal.
6. O histórico não registra qual método, base de custeio ou canal originou o preço.
7. O modo Simples não pode receber premissas mensais difíceis nem perder sua rapidez.

## 3. Objetivos

- Reutilizar gastos recorrentes ativos sem redigitação.
- Oferecer faturamento médio observado e meta necessária como referências identificadas.
- Permitir custeio por faturamento com fórmula determinística e auditável.
- Preservar o rateio por unidades para quem prefere o método atual.
- Salvar perfis de taxas e aplicar exatamente um perfil por cálculo.
- Persistir método, bases e canal no histórico.
- Manter o modo Simples sem mão de obra, custeio mensal ou automação silenciosa.

## 4. Não objetivos

- Criar uma tela paralela de “Dados de entrada” ou “Custeio mensal”.
- Cadastrar funcionários, folha de pagamento, equipamentos ou consumo energético nesta entrega.
- Tratar pró-labore como salário/hora automaticamente.
- Inferir produção, faturamento ou custos para contas sem dados.
- Aplicar vários canais simultaneamente; combinações devem ser um perfil próprio.
- Alterar preços de produtos já cadastrados sem ação da pessoa.
- Aplicar migrations em banco externo sem autorização.

## 5. Princípios

1. **Uma fonte de verdade:** Gastos Fixos, Financeiro e Pró-labore continuam canônicos.
2. **Sugestão não é aplicação:** dados encontrados começam desmarcados.
3. **Origem visível:** cada base informa período e fonte.
4. **Sem precisão inventada:** meses sem faturamento não entram na média.
5. **Markup não é margem:** a UI mantém “acréscimo sobre o custo” e mostra a margem real.
6. **Progressive disclosure:** custeio avançado vive no modo Completo/Profissional.

## 6. Escopo funcional

### 6.1 Fontes de custos mensais

- Buscar gastos recorrentes ativos já cadastrados.
- Mostrar descrição, valor e seleção individual.
- Oferecer “Selecionar todos” e “Limpar”.
- O total selecionado é a única base mensal usada no cálculo.
- Ausência de gastos mostra orientação para cadastrar ou informar um total manual.
- Alterações futuras nos gastos não reescrevem cálculos históricos.

### 6.2 Bases de faturamento

- Oferecer média dos três meses anteriores completos com receita positiva.
- Excluir mês corrente para evitar média parcial.
- Mostrar quantos meses participaram e seus períodos.
- Oferecer o faturamento necessário da Meta de pró-labore quando disponível.
- Permitir valor manual.
- Nenhuma opção vem aplicada; a pessoa escolhe uma fonte.
- Meta de pró-labore é rotulada como “faturamento necessário”, nunca como faturamento observado.

### 6.3 Métodos de custos indiretos

#### Rateio por unidades

- Preserva o comportamento atual.
- `custo fixo por unidade = gastos mensais ÷ produção mensal`.
- Exige ambos os valores quando iniciado.

#### Custeio por faturamento

- `taxa de custeio = custos mensais selecionados ÷ base de faturamento`.
- A taxa precisa ser maior que zero e menor que 95%.
- `custo direto = insumos + embalagem + mão de obra`.
- `lucro desejado = custo direto × acréscimo sobre custo`.
- `preço base = (custo direto + lucro desejado) ÷ (1 − taxa de custeio)`.
- `custos indiretos por unidade = preço base × taxa de custeio`.
- `preço do canal = preço base ÷ (1 − taxa do canal)`.
- O resultado informa custo direto, custos indiretos, lucro, taxa de custeio e taxa do canal.

### 6.4 Perfis de canal

- Perfis pertencem à conta e sincronizam entre Android e PWA.
- Cada perfil tem nome e percentual entre 0 e 95.
- Perfis iniciais, quando a conta ainda não salvou preferências: iFood e Cartão, ambos zerados.
- Permitir adicionar, renomear, alterar e remover perfis.
- “Venda direta” é uma opção fixa de 0% e não é persistida.
- Apenas um perfil é aplicado por cálculo.
- Combinações como “iFood + cartão” são cadastradas como um perfil próprio.

### 6.5 Resultado e histórico

- Persistir `allocationMode`, `monthlyFixedCosts`, `revenueBasis`, `overheadPercent` e `channelName`.
- Cálculos antigos continuam como `unit` e preservam valores existentes.
- O resultado mostra a origem do custeio e o canal aplicado.
- O histórico mostra o canal quando houver.
- “Salvar e criar produto” continua navegando imediatamente e salva em paralelo.

## 7. Estados e validações

- Carregando fontes financeiras.
- Sem gastos recorrentes.
- Sem faturamento histórico/meta.
- Erro recuperável em uma fonte não bloqueia o preenchimento manual.
- Taxa de custeio `>= 95%` é recusada com explicação.
- Taxa de canal `> 95%` é recusada.
- Valor mensal selecionado sem faturamento é incompleto.
- Método por unidades mantém a validação de produção maior que zero.
- Valores sugeridos nunca alteram campos antes do toque explícito.

## 8. Modelo de dados

### `pricing_calculations`

- `allocation_mode`: `unit | revenue` com default `unit`.
- `monthly_fixed_costs`: decimal nullable.
- `revenue_basis`: decimal nullable.
- `overhead_percent`: decimal default 0.
- `channel_name`: varchar nullable.

### `pricing_preferences`

- `user_id`: PK/FK para usuário.
- `channel_fees`: JSONB com lista `{ id, name, percent }`.
- `updated_at`.

## 9. API e contratos

- `GET /api/v1/pricing/preferences` retorna defaults ou preferências persistidas.
- `PUT /api/v1/pricing/preferences` valida e salva perfis.
- `POST /api/v1/pricing/calculate` aceita os novos campos e recalcula tudo no servidor.
- O cliente calcula localmente para feedback, mas o servidor permanece autoridade ao salvar.
- Todas as operações são escopadas por `userId`.

## 10. Direção de interface

- Reutilizar o wizard de cinco etapas da Precificação Completa.
- Etapa 4 passa a oferecer “Por unidades” e “Por faturamento”.
- Fontes encontradas aparecem em cards compactos, recolhíveis e selecionáveis.
- Mostrar uma única fórmula-resumo antes de avançar.
- Etapa 5 mostra perfis em chips/cards e edição sob ação explícita.
- Sem dashboard corporativo denso, barras de completude ou bloqueio sequencial de módulos.

## 11. Métricas

- Uso de gastos recorrentes na precificação.
- Escolha de faturamento histórico, meta ou manual.
- Uso do método por faturamento versus unidades.
- Perfis de canal criados e aplicados.
- Conversão cálculo salvo → produto criado.

## 12. Critérios de aceite

1. O modo Simples permanece matematicamente e visualmente inalterado.
2. Nenhuma fonte financeira é aplicada automaticamente.
3. Selecionar gastos atualiza a taxa ao vivo e informa a origem.
4. Meses sem receita não entram na média histórica.
5. Custeio por faturamento preserva o lucro desejado após reservar custos indiretos.
6. Um perfil de canal preserva o preço líquido via gross-up.
7. Preferências sincronizam pela API e são isoladas por usuário.
8. Histórico antigo continua legível.
9. Testes de domínio cobrem fórmulas, validações, defaults e persistência.
10. Typecheck, lint, testes direcionados e context lint passam.

## 13. Definição de pronto

- Contracts, migration, schema, API, mobile e testes entregues.
- Contextos técnicos de Pricing atualizados.
- PRD indexado na rede de conhecimento.
- Migration criada e aplicada no Supabase de produção.
- Revisão final confirma os scars: sem premissas silenciosas, sem chamar markup de margem e sem
  bloquear “Salvar e criar produto” na persistência remota.

## 14. Evidências da implementação

- Contratos, schema, migration `051`, API, proteção de plano e app implementados.
- 712 testes da API e 427 testes do app aprovados em 2026-08-08.
- Typecheck de contracts, database, API e mobile aprovado.
- Lint de API e mobile, context lint e build PWA `lucro-caseiro` aprovados.
- A migration 051 foi aplicada no Supabase `ujwxvpceqigvyxcqolch`; as novas colunas e a tabela
  `pricing_preferences` foram verificadas após a transação.
- API e PWA publicadas pelo commit `93839a0`; deploys Railway
  `aa904abf-5100-4a80-8370-b776fbcd2b7c` e `113913d5-1c43-49e3-b41e-2042b050004a` concluídos
  com sucesso.
- Smoke de produção confirmou health da API, HTML, bundle com as novas telas e service worker em
  HTTP 200.
