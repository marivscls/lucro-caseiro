# PRD — Serviços no Lucro Caseiro

## Objetivo

Adicionar serviços como cadastro de primeira classe, separado de produtos, para que
prestadores organizem atendimentos, confiram a formação do preço e reutilizem o
cadastro na Agenda.

A experiência deve atender profissionais em geral — de beleza, manutenção,
consultoria, aulas, criação, eventos e atendimento online ou presencial — sem
presumir que o serviço pertence a um segmento específico.

## Escopo

- Nova rota autenticada `/services`, acessível pelo menu Mais e pela navegação desktop.
- Lista pesquisável de serviços ativos e inativos.
- Visão geral com serviços disponíveis, preço médio, duração média e cadastros que
  precisam revisar o preço.
- Filtros por disponíveis, pausados, todos e serviços sem preço ou abaixo do custo
  informado.
- Cards operacionais com disponibilidade, duração, preço cobrado, custo estimado e
  preço sugerido quando houver dados suficientes.
- Criação e edição com:
  - nome;
  - descrição opcional;
  - duração em minutos;
  - preço padrão opcional;
  - situação ativa/inativa.
- Atalhos de duração para os tempos mais comuns, sem impedir valores livres.
- Linguagem e exemplos neutros para diferentes modalidades de prestação de serviço.
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
- “Disponível” significa que o serviço pode ser escolhido em um novo agendamento;
  “Pausado” preserva o cadastro e o histórico.
- Um serviço disponível sem preço, ou com preço abaixo do custo estimado informado,
  aparece como item a revisar.

## Fora do escopo inicial

- Estoque próprio de serviços.
- Itens detalhados de materiais por serviço.
- Serviço como item do carrinho de venda.
- Serviço no catálogo público.
- Impostos e agenda recorrente.

## Expansão v2 — ciclo completo do atendimento

### Objetivo

Transformar o cadastro de Serviços em um fluxo operacional completo:

`divulgação → solicitação → agendamento → atendimento → recebimento → histórico`

A expansão reutiliza os módulos existentes. Um atendimento continua sendo uma
encomenda da Agenda; um recebimento continua sendo uma venda e um lançamento
financeiro; um saldo em aberto continua aparecendo no Fiado; a divulgação usa o
Catálogo público da conta.

### 1. Atendimento completo

- Um serviço pode ser agendado para um cliente com data, horário, duração e valor.
- O atendimento registra a modalidade:
  - no estabelecimento;
  - no endereço do cliente;
  - online;
  - modalidade combinada no momento do agendamento.
- A modalidade pode guardar endereço, referência ou link da reunião.
- O serviço define um intervalo de segurança após o atendimento para a conferência
  de conflitos da Agenda.
- O ciclo próprio do atendimento possui os estados:
  - agendado;
  - confirmado;
  - em andamento;
  - concluído;
  - cancelado;
  - cliente não compareceu.
- Mudanças de estado preservam a compatibilidade com o pipeline já existente de
  encomendas.

### 2. Conclusão e recebimento

- Ao concluir um atendimento, a pessoa informa:
  - valor efetivamente cobrado;
  - valor total já recebido;
  - forma de pagamento;
  - custo adicional ocorrido no atendimento.
- Um atendimento integralmente pago cria uma venda paga e sua entrada financeira.
- Um atendimento sem pagamento cria uma venda no crédito e aparece no Fiado.
- Um atendimento parcialmente pago registra a parte recebida no Financeiro e cria
  no Fiado apenas o saldo restante.
- A conclusão é idempotente: repetir a ação não pode duplicar venda, Fiado ou
  lançamento financeiro.
- Atendimento pago por sessão de pacote consome uma sessão e não cria uma segunda
  cobrança.

### 3. Histórico e indicadores

Cada serviço possui uma visão operacional própria com:

- total de atendimentos;
- atendimentos concluídos;
- cancelamentos e não comparecimentos;
- faturamento realizado;
- custo real ou estimado;
- lucro estimado;
- valor médio cobrado;
- horas atendidas;
- lucro por hora;
- clientes que mais contrataram;
- histórico recente de atendimentos;
- solicitações recebidas pela página pública.

As métricas financeiras consideram somente atendimentos concluídos e nunca inferem
pagamento a partir do estado operacional.

### 4. Variações e adicionais

- Um serviço pode ter variações com nome, duração e preço próprios.
- Um serviço pode ter adicionais com nome, acréscimo de duração e preço.
- Variações e adicionais podem ser pausados sem apagar o histórico.
- Ao escolher uma variação ou adicionais na Agenda, duração e valor são preenchidos
  a partir do serviço e continuam editáveis para aquele atendimento.
- O histórico preserva os nomes escolhidos mesmo se a oferta for pausada depois.

### 5. Pacotes e recorrência

- Um serviço pode oferecer pacotes com:
  - nome;
  - número de sessões;
  - preço;
  - validade em dias;
  - intervalo sugerido entre sessões.
- A venda do pacote é vinculada a um cliente e registra forma de pagamento.
- Pagamento no crédito aparece no Fiado.
- O saldo de sessões mostra usadas, restantes, validade e situação.
- Um agendamento pode usar uma sessão de pacote válida.
- A sessão é consumida somente quando o atendimento é concluído.

### 6. Divulgação e solicitação pública

- Serviços marcados como públicos aparecem no Catálogo já existente da conta.
- A página mostra nome, descrição, duração, preço inicial, variações, adicionais e
  pacotes ativos.
- A pessoa interessada pode enviar uma solicitação com:
  - nome;
  - telefone;
  - serviço;
  - data e horário desejados;
  - modalidade;
  - observações.
- A solicitação não confirma automaticamente um horário.
- O prestador vê as solicitações na gestão do serviço, pode contatar a pessoa pelo
  WhatsApp e marcar a solicitação como contatada, confirmada ou recusada.
- A página pública nunca expõe custos internos, lucro, valor da hora ou informações
  de outros clientes.

### Regras transversais

- Toda operação autenticada é escopada por `userId`.
- IDs enviados pelo cliente são validados contra o mesmo usuário e serviço.
- Valores históricos são preservados por snapshot quando uma oferta pode mudar.
- Ações financeiras são travadas por atendimento e confirmam o ID retornado.
- Estados vazios, carregamento, erros e formulários seguem os componentes canônicos
  do Lucro Caseiro.
- No desktop, páginas autenticadas usam a zona de dados de até 1280 px e o shell é o
  único dono do gutter horizontal.
- Modais usam `StandardModal`, mantêm o campo focado acima do rodapé e não repetem
  cabeçalhos decorativos.
- A experiência continua neutra para beleza, consultoria, aulas, manutenção,
  criação, eventos e atendimentos presenciais ou online.

### Critérios de aceite da expansão

1. É possível configurar modalidade, intervalo, variações, adicionais, pacotes e
   divulgação no cadastro do serviço.
2. É possível criar um atendimento usando serviço, variação, adicionais ou uma
   sessão de pacote.
3. A Agenda impede sobreposição considerando duração e intervalo de segurança.
4. O atendimento percorre os seis estados próprios sem quebrar encomendas comuns.
5. Concluir um atendimento pago cria uma única venda e uma única entrada.
6. Concluir um atendimento parcial cria somente o saldo restante no Fiado.
7. Concluir um atendimento com pacote consome exatamente uma sessão.
8. A visão do serviço apresenta histórico e indicadores derivados de dados reais.
9. O Catálogo exibe somente serviços públicos e nunca revela custos internos.
10. Uma solicitação pública fica visível para o proprietário e pode mudar de estado.
11. Contratos, migrations, API e mobile possuem testes para regras financeiras,
    isolamento por usuário, idempotência e cálculos.
12. Lint, typecheck, testes e build PWA passam antes de publicação.

## Critérios de aceite

1. A pessoa encontra Produtos e Serviços como áreas separadas.
2. Consegue criar, editar, pesquisar, desativar e reativar um serviço.
3. A formação opcional do preço considera duração e valor da hora corretamente.
4. O preço sugerido inclui custos, acréscimo e taxas informados, sem premissas ocultas.
5. Um serviço ativo aparece na Agenda e preenche duração e preço padrão.
6. Serviço inativo permanece gerenciável, mas não aparece para um novo pedido.
7. Contratos, API, persistência e UI passam em testes, lint de contexto e typecheck.
8. A tela oferece uma visão operacional dos serviços, sem exigir que a pessoa abra
   cada cadastro para descobrir duração, preço ou situação da formação de custo.
9. Textos e exemplos são compreensíveis para diferentes profissões e modalidades de
   atendimento.
