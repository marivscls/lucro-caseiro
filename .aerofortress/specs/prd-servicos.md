# PRD — Serviços no Lucro Caseiro

## Objetivo

Adicionar serviços como cadastro de primeira classe, separado de produtos, para que
prestadores organizem atendimentos, confiram a formação do preço e reutilizem o
cadastro na Agenda.

## Escopo

- Nova rota autenticada `/services`, acessível pelo menu Mais e pela navegação desktop.
- Lista pesquisável de serviços ativos e inativos.
- Criação e edição com:
  - nome;
  - descrição opcional;
  - duração em minutos;
  - preço padrão opcional;
  - situação ativa/inativa.
- Conferência opcional de preço com:
  - custo agregado de materiais;
  - valor da hora;
  - outros custos;
  - rateio de custos fixos;
  - acréscimo sobre o custo;
  - taxas sobre a venda.
- Resultado ao vivo com mão de obra, custo total e preço sugerido.
- Ação explícita para copiar o preço sugerido para o preço padrão.
- Serviços ativos disponíveis no formulário da Agenda, preenchendo duração e preço.

## Regras

- Produtos e serviços coexistem; o perfil de negócio não transforma a área de
  Produtos em Serviços.
- Toda leitura e mutação é escopada por `userId`.
- Nome duplicado do mesmo usuário é rejeitado sem diferenciar maiúsculas,
  minúsculas ou espaços externos.
- Desativar preserva o histórico e impede novas seleções na Agenda.
- O resultado é uma estimativa baseada apenas nos dados informados.
- “Acréscimo sobre o custo” não deve ser chamado de margem de lucro.
- Nenhuma premissa de custo ou produção é preenchida silenciosamente.

## Fora do escopo inicial

- Estoque próprio de serviços.
- Itens detalhados de materiais por serviço.
- Serviço como item do carrinho de venda.
- Serviço no catálogo público.
- Impostos e agenda recorrente.

## Critérios de aceite

1. A pessoa encontra Produtos e Serviços como áreas separadas.
2. Consegue criar, editar, pesquisar, desativar e reativar um serviço.
3. A formação opcional do preço considera duração e valor da hora corretamente.
4. O preço sugerido inclui custos, acréscimo e taxas informados, sem premissas ocultas.
5. Um serviço ativo aparece na Agenda e preenche duração e preço padrão.
6. Serviço inativo permanece gerenciável, mas não aparece para um novo pedido.
7. Contratos, API, persistência e UI passam em testes, lint de contexto e typecheck.
