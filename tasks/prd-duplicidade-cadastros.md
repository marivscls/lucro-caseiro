# PRD — Bloqueio e alerta de duplicidade em cadastros

> Status: em implementacao.
> Origem: pergunta da usuaria sobre cadastrar novamente um insumo ja existente
> ("farinha de trigo") e auditoria das telas cadastraveis do app.

## Problema

Cadastros mestres duplicados deixam o app confuso: o mesmo insumo aparece duas
vezes na receita, o mesmo cliente se divide em historicos diferentes, o mesmo
fornecedor pulveriza compras, e produtos com o mesmo codigo quebram busca e
scanner. Hoje a maior parte dessas entidades tem apenas indices de busca, sem
bloqueio real de duplicidade por usuario.

Ao mesmo tempo, nem toda repeticao e erro. Vendas, compras, lancamentos,
encomendas e orcamentos sao eventos/transacoes; duas linhas parecidas podem ser
legitimas.

## Objetivo

Evitar duplicidade acidental em cadastros mestres, sem bloquear eventos legitimos
do negocio.

## Escopo

### Bloqueio forte

- **Insumos**: bloquear outro insumo com mesmo nome e unidade para o mesmo
  usuario. Ao tentar cadastrar novamente, orientar a ajustar estoque do insumo
  existente.
- **Produtos**: bloquear codigo de barras/SKU repetido para o mesmo usuario,
  considerando apenas produtos ativos. Nome repetido deve ser aviso, nao bloqueio
  forte.
- **Clientes**: bloquear telefone repetido para o mesmo usuario quando o telefone
  for informado. Nome sozinho nao bloqueia.
- **Fornecedores**: bloquear nome, telefone ou e-mail repetidos para o mesmo
  usuario, quando os respectivos campos forem informados.
- **Embalagens**: bloquear nome + tipo repetidos para o mesmo usuario.

### Aviso sem bloqueio forte

- **Produtos**: nome repetido mostra alerta com opcao de continuar.
- **Receitas**: nome repetido mostra alerta com opcao de continuar, pois
  variacoes e duplicacao intencional sao validas.
- **Rotulos**: nome/produto/template parecido mostra alerta com opcao de
  continuar.

### Fora do escopo de bloqueio

- **Vendas**
- **Compras**
- **Financeiro / lancamentos avulsos**
- **Gastos recorrentes** (pode receber aviso no futuro)
- **Encomendas / agenda**
- **Orcamentos**

Essas telas registram eventos ou propostas; repeticao pode ser normal.

## Regras de comparacao

- Comparar texto com `trim` e case-insensitive.
- Telefones devem comparar apenas digitos.
- E-mails devem comparar em lowercase.
- Codigo de produto compara `trim` e case-insensitive.
- Em update, ignorar o proprio registro.

## Aceite

- API rejeita duplicata forte com `ValidationError`.
- Mobile mostra mensagem amigavel quando a API rejeitar duplicata.
- Mobile mostra confirmacao para duplicatas provaveis em produtos, receitas e
  rotulos, permitindo continuar.
- Nenhuma tela transacional passa a bloquear repeticoes legitimas.
- Testes cobrem ao menos as regras fortes dos usecases.
