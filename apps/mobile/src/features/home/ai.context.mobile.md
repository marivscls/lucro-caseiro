# Início: rotina e dinheiro

## Purpose

Reunir compromissos, ações por perfil, valores do período, recebimentos pendentes, alertas e meta de retirada na tela Início.

## Non-goals

Não calcular lucro contábil, enviar cobranças, mudar permissões, criar uma agenda paralela ou alterar regras financeiras do servidor.

## Boundaries & Ownership

A rota `app/tabs/index.tsx` mantém autenticação, orientação inicial e composição. Home apresenta dados; Agenda, Produtos e Financeiro mantêm seus formulários e detalhes. `business-profile.tsx` oferece apresentação compacta após atividade.

## Code pointers

- `components.tsx`: seções Seu dia, Ações rápidas, Dinheiro, Precisa de atenção e Meta do mês.
- `domain.ts`: estados de consulta, seleção de compromissos, recebimentos, ações e alertas.
- `hooks.ts`: vendas pendentes paginadas e produtos completos.
- `../../app/tabs/agenda.tsx`: parâmetros `orderId` e `create=home`.
- `../../app/products.tsx`: parâmetro `productId`.
- `../finance/components/finance-dashboard.tsx`: `create=expense|income`.

## Components

HomeDay abre detalhes da agenda. HomeQuickActions adapta ações a serviços e disponibilidade da agenda. HomeMoney distingue vendido, entradas, despesas e saldo dos lançamentos. HomeAttention limita a três alertas verificáveis. HomeGoal explica entradas consideradas na meta.

## Hooks

useHomePendingSales percorre todas as páginas; qualquer falha impede apresentar um total parcial. useHomeProducts reutiliza fetchAllProducts. Prefixos de cache sales/products recebem invalidação das operações existentes. useOrders aceita enabled para não consultar agenda desabilitada pela marca.

## API Integration

Somente consultas existentes de sales, finance, insights, goals, orders e products. Nenhum novo endpoint ou migração. Chamadas seguem apiClient autenticado. O servidor continua responsável pela autorização.

## Contracts

Order, Product, Sale e ProlaboreStatus de contracts. Valores de venda pendente usam total menos paidAmount. Compromissos da agenda são exibidos separadamente, descontam deposit e excluem os que têm saleId para evitar dupla contagem. Meta usa currentRevenue fornecido pelo servidor, cujo cálculo considera entradas financeiras.

## Error Handling

Ausência sem erro é carregamento; ausência com erro é indisponibilidade. Dados em cache com falha são preservados com aviso e repetição. Zero só é apresentado a partir de dados retornados. Meta indisponível não se transforma em convite para criar outra.

## Performance

Cache compartilhado por prefixo. Apenas três compromissos e três alertas no início. Consultas de produtos para alertas e agenda respeitam disponibilidade. Totais de recebimento não usam só a primeira página. Dados de toda a conta são necessários para soma; considerar agregação no servidor se volume justificar.

## Test matrix

Testes de domínio: estados desconhecido/erro/cache/zero, ordem de prazos, exclusão de concluídos, saldo parcial, serviços e alertas. Testes de hooks: paginação e falha intermediária. Testes de componentes: consulta financeira lenta após vendas, erro, zero confirmado, cache e meta indisponível. Script `scripts/home-validation.cjs` usa navegador isolado e intercepta chamadas externas com dados fictícios.

## Examples

Venda de 100 com 25 recebidos apresenta 75 a receber. Consulta financeira pendente apresenta carregamento, sem R$ 0,00. Serviço com agenda disponível oferece Agendar atendimento. Estoque sem limiar configurado não gera alerta.

## Change log / Decisions

2026-09-10: implementadas todas as prioridades aprovadas de conteúdo e clareza da home. Mantidas marca e escala de fonte; retirados limites de ampliação dos novos valores e ações. Textos refletem o cálculo existente da meta por entradas, corrigindo a interpretação inicial de vendas realizadas.

A navegação compartilhada permite quebra de linha, com reserva adaptada à escala de fonte em `shared/layout/floating-tab-bar.ts`. Serviços usa duas colunas de atalhos em telas menores que 600 px. Evidências e limites da validação em `docs/home-ui-validation/README.md`.
