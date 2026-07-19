# PRD — Lucro na Papelaria

Status: implementado e validado em código; migrações aguardam aplicação no ambiente
Data: 2026-07-19
Responsável: Produto e Engenharia

## Resumo

O Lucro na Papelaria é um produto vertical para papelarias e lojas de artigos para
festas que precisam controlar catálogo, variações, compras, estoque e vendas sem
planilhas. Ele compartilha infraestrutura, autenticação, componentes e API com o
Lucro Caseiro, mas possui jornada, navegação, linguagem e regras próprias.

O lançamento não é considerado pronto quando apenas nome, cores, ícones e build
estão separados. A operação essencial precisa fechar o ciclo:

`cadastrar produto → comprar/receber estoque → vender → baixar estoque → cancelar e devolver → acompanhar resultado`.

## Problema

A base atual já exporta o PWA e o aplicativo Android da marca Papelaria e declara
flags de estoque, agenda, ficha técnica e variações. Porém, parte dessas flags ainda
não governa todos os pontos de entrada; o onboarding continua genérico; compras são
apenas despesas; custo de revenda não é informado no cadastro; e o estoque das
variações não participa integralmente do ciclo de venda e cancelamento.

Isso produz um aplicativo visualmente diferente, mas operacionalmente incompleto
para uma papelaria.

## Público e trabalhos principais

Público primário: dona, gerente ou atendente de uma papelaria de bairro ou loja de
artigos para festas, operando uma única unidade e um estoque compartilhado.

Trabalhos que o produto deve resolver:

1. Cadastrar rapidamente itens por nome, categoria, SKU/código de barras, custo,
   preço, estoque mínimo e foto.
2. Representar variações como cor, tamanho ou modelo, cada uma com estoque próprio.
3. Registrar entrada de mercadoria vinculada a fornecedor, produto e variação.
4. Registrar venda por item ou código de barras e impedir estoque negativo.
5. Devolver o estoque quando uma venda é cancelada e reconciliar alterações de itens.
6. Identificar itens e variações em falta ou abaixo do mínimo.
7. Acompanhar vendas, faturamento, despesas, lucro, clientes e fiado.
8. Compartilhar catálogo e criar etiquetas/QR sem recursos alimentícios irrelevantes.

## Princípios de produto

- A marca é resolvida no build; não existe seletor de marca em runtime.
- Código compartilhado, comportamento configurado por capacidades semânticas.
- Nenhuma tela exclusiva depende apenas de ser escondida no menu: deep links e API
  também respeitam a capacidade da marca.
- Estoque de variação é a fonte de verdade quando o produto possui variações;
  estoque do produto é usado quando não possui.
- Compras com itens representam recebimento de mercadoria. Compra sem itens continua
  válida para despesas gerais e compatibilidade com dados antigos.
- Dados antigos continuam legíveis; novos campos e relações têm defaults seguros.
- O PWA da Papelaria deve ter paridade funcional com o aplicativo Android.

## Escopo funcional P0

### 1. Identidade e onboarding

- Build, bundle, scheme, assets, manifesto e saída PWA próprios.
- Onboarding da Papelaria não pergunta qual é o nicho; registra automaticamente o
  tipo de negócio de papelaria e pede apenas o nome da loja.
- Textos iniciais falam de catálogo, estoque, compras e vendas.

### 2. Navegação por domínio

Disponíveis: Início, Vendas, Nova venda, Produtos, Estoque, Fornecedores, Compras,
Clientes, Fiado, Financeiro, Gastos fixos, Insights, Catálogo, Orçamentos,
Precificação, Etiquetas/QR, Configurações e Suporte.

Ocultos e protegidos: Agenda/encomendas, Receitas/fichas alimentícias, Insumos de
produção e Embalagens de produção.

### 3. Produtos de revenda

- Nome, categoria, descrição, foto, SKU/código de barras, custo unitário, preço de
  venda, estoque atual e estoque mínimo.
- O preço deve ser maior que zero; custo não pode ser negativo; código é único por
  conta quando informado.
- A interface mostra margem bruta estimada quando custo e preço existem.
- Venda por peso fica indisponível na Papelaria.
- Kits continuam disponíveis conforme o plano comercial existente.

### 4. Variações

- Cada variação possui identificador estável, nome, cor, tamanho/modelo e estoque.
- Nomes de variação não podem se repetir dentro do mesmo produto.
- Produto com variações exige a escolha da variação na venda.
- O estoque disponível exibido para o produto é a soma dos estoques das variações.
- Alerta de estoque considera cada variação contra o estoque mínimo do produto.

### 5. Compras e recebimento

- Uma compra pode ter fornecedor, descrição, data, estado de pagamento e itens.
- Cada item informa produto, variação quando aplicável, quantidade e custo unitário.
- O total é calculado pela soma dos itens quando eles existem.
- Registrar a compra repõe o estoque e atualiza o custo direto do produto.
- Compras antigas ou despesas sem mercadoria continuam usando descrição e valor.

### 6. Vendas e consistência de estoque

- A venda valida o estoque agregado por produto/variação antes de gravar.
- Variações têm baixa própria; produtos sem variação usam o estoque do produto.
- Cancelar uma venda devolve exatamente os itens ao mesmo produto/variação.
- Editar itens reconcilia somente a diferença entre o estado anterior e o novo.
- Uma venda nunca pode levar produto ou variação a estoque negativo.

### 7. Marca na API

- Toda chamada do mobile/PWA envia `x-brand` com a marca ativa.
- Operações de variações e módulos desabilitados são rejeitadas pela API quando a
  capacidade correspondente está desligada.
- Marca desconhecida é rejeitada; autenticação e autorização continuam baseadas no
  token, nunca no header.

## Dados e compatibilidade

- `products.cost_price` continua opcional e passa a ser aceito nas bordas públicas.
- `products.variations` continua em JSONB com IDs estáveis e estoque por variação.
- Nova relação `purchase_items` guarda produto, snapshots de nome/variação,
  quantidade e custo unitário.
- Compras existentes recebem `items: []` na resposta sem migração destrutiva.
- Itens de venda já guardam `variation_id` e `variation_name`; cancelamentos antigos
  sem variação continuam restaurando o estoque do produto.

## Critérios de aceitação

1. Um build Papelaria abre com identidade própria e não oferece seleção de nicho.
2. Agenda, Receitas, Insumos e Embalagens não aparecem nos menus mobile/desktop e
   deep links retornam ao início.
3. Requisições do PWA Papelaria chegam à API com `x-brand: lucro-papelaria`.
4. É possível criar um produto com custo, preço, código e duas variações com estoques
   diferentes; a margem e o estoque total são exibidos corretamente.
5. Registrar compra de 5 unidades de uma variação aumenta seu estoque em 5 e salva o
   custo informado.
6. Vender 2 unidades da mesma variação diminui seu estoque em 2.
7. Duas linhas iguais na mesma venda não conseguem ultrapassar o estoque disponível.
8. Cancelar a venda do item anterior devolve 2 unidades; cancelar novamente é negado.
9. Editar uma venda de 2 para 3 unidades baixa apenas mais 1; trocar de variação
   devolve a anterior e baixa a nova.
10. Produto/variação sem estoque suficiente retorna erro de validação e não fica
    negativo.
11. Lucro Caseiro e Lucro na Manicure mantêm seus recursos e builds sem receber
    textos, cores ou capacidades da Papelaria.
12. Typecheck de brands, contracts, database, API e mobile; testes de domínio/API; e
    build PWA Papelaria terminam com sucesso.

## Métricas de lançamento

- Ativação: produto criado e primeira venda registrada.
- Adoção de estoque: percentual de produtos com estoque e mínimo configurados.
- Adoção de variações: contas com ao menos um produto variado.
- Ciclo de reposição: contas que registram compra com itens após alerta de estoque.
- Integridade: zero eventos aceitos que resultem em estoque negativo.

## Fora de escopo desta versão

- Múltiplas lojas, depósitos ou estoques por localização.
- Pedido de compra com aprovação e recebimentos parciais.
- Emissão de NFC-e/NF-e, SPED ou integração contábil/fiscal.
- Integrações com marketplace, maquininha, balança ou ERP externo.
- Grade matricial automática (produto cartesiano cor × tamanho); as variações são
  cadastradas explicitamente para evitar combinações inexistentes.
- Inventário por lote, validade ou número de série.

## Plano de entrega

1. Contratos e capacidades de marca.
2. Navegação/onboarding/copy por domínio.
3. Produto, custo e editor canônico de variações.
4. Estoque consistente em vendas e cancelamentos.
5. Compra com itens e reposição de estoque.
6. Testes, migração, typecheck e build PWA Papelaria.

## Evidências de implementação

- Typecheck aprovado em `brands`, `contracts`, `database`, `api` e `mobile`.
- Suítes completas aprovadas: 632 testes da API e 341 testes do app.
- Lint aprovado em `contracts`, `api` e `mobile` (API sem erros e com warnings
  preexistentes permitidos).
- PWA da marca gerado isoladamente por `build:pwa:papelaria` em
  `apps/mobile/dist/lucro-papelaria`.
- Migrações `039_purchase_items.sql` e `040_catalog_brand.sql` prontas para serem
  aplicadas antes da publicação da API.
