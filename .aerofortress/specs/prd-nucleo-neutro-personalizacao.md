# PRD — Núcleo neutro e experiência personalizada por tipo de negócio

**Status:** aprovado para implementação
**Data:** 2026-07-25
**Produto:** Lucro Caseiro — Android e PWA
**Base canônica analisada:** commit `48c5783`
**Responsáveis:** Produto, Design e Engenharia

## 1. Resumo executivo

O Lucro Caseiro atende negócios de alimentação, produção artesanal, comércio, beleza e
serviços, mas a primeira impressão do aplicativo ainda é fortemente associada à confeitaria.
Essa percepção não nasce de uma única tela: ela resulta da soma de exemplos com bolos e
brigadeiros, nomenclaturas universais como “Receitas” e “Insumos”, ilustrações delicadas,
corações e uma presença visual de rosa maior do que a necessária em áreas operacionais.

Este projeto cria um núcleo de produto visual e verbalmente neutro, preservando o rosa como
assinatura da marca e adaptando vocabulário, exemplos e prioridades ao tipo de negócio informado
pela pessoa. A estrutura interna e as regras financeiras continuam compartilhadas. O que muda é
a forma como o produto se apresenta, orienta e nomeia os mesmos conceitos.

O resultado esperado é que uma confeiteira continue se reconhecendo no produto sem que uma
artesã, manicure, fotógrafa, prestadora de serviços ou comerciante sinta que entrou em um
aplicativo feito para outra profissão.

## 2. Regra de base e isolamento

Este PRD descreve exclusivamente o produto presente no commit `48c5783`.

Alterações locais ainda não commitadas ou não aprovadas pela dona do produto:

- não compõem o diagnóstico;
- não justificam requisitos;
- não são consideradas comportamento canônico;
- não devem ser sobrescritas durante a implementação;
- devem ser separadas do novo trabalho ao revisar diffs e preparar futuros commits.

Quando uma tela deste PRD também estiver alterada localmente, a implementação deve comparar o
arquivo com `git show HEAD:<caminho>` e manter cada novo hunk identificável.

## 3. Problema

### 3.1 Sinais verbais

- O onboarding apresenta “Confeitaria e bolos” e “Salgados e marmitas” antes dos demais perfis.
- O nome de negócio sugerido é “Doces da Maria”.
- Cadastros e formulários usam brigadeiro, bolo, leite condensado e categorias alimentícias como
  exemplos universais.
- “Receitas”, “Insumos”, “Rendimento” e “Embalagens” aparecem como nomes fixos mesmo quando o
  conceito equivalente seria ficha de custo, materiais, duração, quantidade ou adicionais.

### 3.2 Sinais visuais

- Rosa, coração, casinha e ilustrações 3D delicadas aparecem juntos em momentos de alta
  visibilidade.
- Cores de marca e cores semânticas nem sempre têm funções claramente separadas.
- Áreas operacionais podem parecer editoriais ou “fofas” quando deveriam priorizar leitura,
  comparação e ação.

### 3.3 Consequência de produto

- Pessoas fora da alimentação podem interpretar que o seu segmento é apenas tolerado, não
  realmente atendido.
- A comunicação limita a percepção de maturidade do produto, apesar de existirem vendas,
  catálogo, clientes, agenda, estoque, finanças, orçamentos e fornecedores.
- A mesma pessoa precisa traduzir mentalmente termos da confeitaria para a própria operação.

## 4. Objetivos

1. Fazer a primeira impressão comunicar “gestão, preço e vendas”, não “aplicativo de confeitaria”.
2. Personalizar vocabulário e exemplos usando o `businessType` já existente no perfil.
3. Reduzir a área visual ocupada pelo rosa sem descaracterizar a marca.
4. Manter alimentação como experiência de primeira classe.
5. Tornar telas operacionais mais profissionais, neutras e legíveis.
6. Preservar regras, dados, limites de plano e compatibilidade com contas existentes.
7. Aplicar a mudança de forma consistente em Android, PWA, tablet e desktop.

## 5. Não objetivos

- Renomear “Lucro Caseiro”.
- Criar um aplicativo ou fork por segmento.
- Alterar entidades, cálculos ou limites de plano apenas para trocar nomenclatura.
- Criar um ERP genérico.
- Prometer suporte a fluxos que o produto não executa.
- Remover o rosa da identidade ou substituí-lo por verde.
- Tornar todas as telas iguais; contexto e densidade continuam variando.
- Reescrever dados históricos quando a pessoa muda o tipo de negócio.
- Incorporar mudanças locais ainda não aprovadas.

## 6. Posicionamento canônico

### 6.1 Descritor

> **Lucro Caseiro — Gestão, preço e vendas para o seu negócio**

### 6.2 Promessa principal

> **Preço certo, vendas organizadas e lucro sob controle.**

### 6.3 Princípio de comunicação

Benefícios universais aparecem antes de ferramentas específicas. “Receitas”, “insumos” e
“embalagens” são recursos contextuais, não a definição do produto.

## 7. Perfis de experiência

O projeto reutiliza o enum já persistido no perfil:

| Valor existente | Apresentação no onboarding         | Ênfase da experiência                          |
| --------------- | ---------------------------------- | ---------------------------------------------- |
| `crafts`        | Produzo sob encomenda              | produtos, fichas técnicas, materiais e pedidos |
| `other`         | Vendo produtos em estoque          | produtos, estoque, compras e vendas            |
| `services`      | Presto serviços                    | serviços, agenda, clientes, tempo e preço      |
| `beauty`        | Trabalho com beleza e atendimentos | serviços, agenda, materiais e clientes         |
| `food`          | Trabalho com alimentação           | receitas, insumos, rendimento e encomendas     |

Essa ordem é canônica: alimentação deixa de ocupar a primeira posição sem perder visibilidade.

### 7.1 Fallback

- Perfil ausente, desconhecido ou ainda não carregado usa cópia neutra.
- O fallback nunca presume alimentação.
- A troca de perfil altera somente apresentação e exemplos; não apaga cadastros.

## 8. Dicionário contextual

| Conceito interno | Neutro            | Alimentação | Produção artesanal   | Comércio            | Serviços/beleza      |
| ---------------- | ----------------- | ----------- | -------------------- | ------------------- | -------------------- |
| `product`        | produto           | produto     | produto              | produto/mercadoria  | serviço              |
| `recipe`         | ficha de custo    | receita     | ficha técnica        | composição de custo | ficha do serviço     |
| `material`       | material          | insumo      | material             | item de custo       | material utilizado   |
| `yield`          | quantidade final  | rendimento  | quantidade produzida | unidades            | duração/atendimentos |
| `packaging`      | custo adicional   | embalagem   | embalagem/acabamento | embalagem           | material adicional   |
| `order`          | pedido            | encomenda   | encomenda            | pedido              | atendimento          |
| `production`     | custos e operação | produção    | produção             | estoque e compras   | serviços e agenda    |

O dicionário é de apresentação. Nomes de rotas, tabelas, chaves de cache e contratos não mudam.

## 9. Exemplos contextuais

### 9.1 Fallback neutro

- Produto: “Kit personalizado”
- Serviço: “Sessão fotográfica”
- Negócio: “Meu negócio”
- Lançamento: “Venda do dia” / “Compra de materiais”
- Categoria: “Personalizados, Serviços, Presentes…”

### 9.2 Alimentação

- “Marmita executiva”
- “Bolo de cenoura”
- “Farinha de trigo”
- “Cozinha da Ana”

### 9.3 Produção artesanal

- “Vela aromática”
- “Kit personalizado”
- “Cera vegetal”
- “Ateliê da Ana”

### 9.4 Comércio

- “Caderno personalizado”
- “Caneca térmica”
- “Fornecedor Central”
- “Loja da Ana”

### 9.5 Serviços e beleza

- “Sessão fotográfica”
- “Manutenção de unhas”
- “Material descartável”
- “Studio da Ana”

## 10. Direção visual

### 10.1 Distribuição de cor

- **70% neutros:** branco quente, bege claro, cinza e grafite.
- **20% cores funcionais:** verde para resultado positivo, azul para informação, âmbar para
  atenção e vermelho para problema.
- **10% rosa:** ação primária, seleção, foco, links importantes e momentos de marca.

### 10.2 Regras executáveis

1. No máximo um elemento grande preenchido de rosa por viewport.
2. Cards operacionais usam `background`, `surface` ou `surfaceElevated`.
3. `primaryBg` não é fundo padrão de seção; é reservado para seleção e destaque curto.
4. Rosa não representa lucro, pagamento, estoque ou alerta.
5. Corações não aparecem em cabeçalhos operacionais.
6. Ilustrações 3D ficam restritas a onboarding, celebrações e estados vazios adequados.
7. Listas, dashboards e formulários usam ícones funcionais.
8. Acessibilidade e contraste seguem WCAG AA.

### 10.3 Elementos preservados

- Rosa oficial da marca.
- Fraunces em títulos editoriais e Nunito Sans nos demais textos.
- Logo e nome atuais.
- Linguagem acolhedora, sem infantilização.

## 11. Fundação técnica

### 11.1 Fonte da personalização

- `UserProfile.businessType` é a fonte persistida.
- O onboarding continua salvando esse campo pela API existente.
- Um helper puro resolve o dicionário contextual.
- Um hook combina perfil, marca ativa e fallback neutro.

### 11.2 Contrato do helper

O helper deve oferecer, no mínimo:

- nomes singular/plural de produto, ficha, material, pedido e embalagem/adicional;
- título da área operacional;
- rótulo de quantidade/rendimento;
- exemplos de negócio, produto, categoria, fornecedor e lançamento financeiro;
- categorias sugeridas;
- mensagem de valor inicial.

### 11.3 Regras de arquitetura

- Uma única implementação canônica; nenhuma tabela paralela em cada tela.
- A camada visual não altera payloads por trocar rótulos.
- Sem `if (businessType === ...)` espalhado em componentes.
- Textos fixos continuam permitidos quando o conceito é realmente universal.
- Testes pequenos cobrem todos os perfis e o fallback.

## 12. Novo onboarding

### 12.1 Etapa 1 — valor universal

Título:

> Preço certo, vendas organizadas e lucro sob controle.

Descrição:

> Cadastre o que você vende, organize clientes e pedidos e acompanhe quanto realmente sobra.

As telas seguintes continuam apresentando vendas e precificação, sem exemplo exclusivo de comida.

### 12.2 Etapa 2 — perfil operacional

Pergunta:

> Como seu negócio funciona?

Descrição:

> Escolha a opção que mais se aproxima da sua rotina. Você poderá mudar depois.

Ordem:

1. Produzo sob encomenda
2. Vendo produtos em estoque
3. Presto serviços
4. Trabalho com beleza e atendimentos
5. Trabalho com alimentação

Cada opção usa ícone funcional ou ilustração neutra e grava o valor existente correspondente.

### 12.3 Etapa 3 — nome do negócio

- Placeholder contextual.
- Fallback: “Ex.: Meu negócio”.
- Explicar que o nome aparece em catálogo, recibos e orçamentos.

### 12.4 Etapa 4 — primeira vitória

- CTA contextual: “Cadastrar meu primeiro produto” ou “Cadastrar meu primeiro serviço”.
- Alternativa: “Explorar o início”.
- Nenhuma ilustração pressupõe confeitaria.

## 13. Matriz de implementação tela por tela

### Onda 1 — primeira impressão e navegação

| Tela          | Mudança obrigatória                             | Aceite                             |
| ------------- | ----------------------------------------------- | ---------------------------------- |
| Login         | subtítulo universal; composição mais neutra     | não citar segmento                 |
| Cadastro      | exemplo de negócio neutro                       | remover “Doces da Maria”           |
| Onboarding    | novo perfil operacional e exemplos contextuais  | alimentação não aparece primeiro   |
| Home          | remover coração; promessa e atalhos contextuais | rosa restrito à ação primária      |
| Tabs          | ícones e estados ativos funcionais              | nenhum novo fill rosa dominante    |
| Mais          | títulos de ficha/material adaptados             | mesma rota e feature gate          |
| Desktop shell | mesmas nomenclaturas da Home/Mais               | nenhum conflito entre mobile e PWA |

### Onda 2 — venda e relacionamento

| Tela       | Mudança obrigatória                          | Aceite                                |
| ---------- | -------------------------------------------- | ------------------------------------- |
| Produtos   | produto/serviço contextual; exemplos neutros | busca e FAB coerentes                 |
| Nova venda | produto/serviço e observações contextuais    | cálculo e payload intactos            |
| Vendas     | nome universal e estados sem rosa semântico  | status usam cor funcional             |
| Agenda     | pedido/atendimento conforme perfil           | agenda continua atendendo alimentação |
| Clientes   | textos universais                            | nenhum exemplo alimentar              |
| Orçamentos | item/serviço contextual                      | PDF não muda regra financeira         |
| Fiado      | linguagem universal                          | sem ilustração temática dominante     |

### Onda 3 — custo e operação

| Tela                  | Mudança obrigatória                                   | Aceite                           |
| --------------------- | ----------------------------------------------------- | -------------------------------- |
| Receitas/fichas       | título, categorias, formulário e detalhes contextuais | dados continuam em `recipes`     |
| Insumos/materiais     | título, formulário e vazio contextuais                | dados continuam em `materials`   |
| Embalagens/adicionais | nomenclatura contextual onde fizer sentido            | não esconder custo existente     |
| Precificação simples  | material/ficha e exemplos contextuais                 | cálculo idêntico                 |
| Precificação completa | etapas contextuais                                    | mão de obra e custos preservados |
| Produtos — cadastro   | categorias e placeholders contextuais                 | nenhum preset só alimentar       |
| Fornecedores          | descrição e exemplos neutros                          | contatos e vínculo intactos      |
| Compras               | produto/material contextual                           | estoque preservado               |

### Onda 4 — gestão e apresentação

| Tela           | Mudança obrigatória                                | Aceite                               |
| -------------- | -------------------------------------------------- | ------------------------------------ |
| Finanças       | exemplos universais; cores estritamente semânticas | rosa não representa receita          |
| Insights       | exemplos e ações contextuais                       | dados observados apenas              |
| Catálogo       | tagline neutra e contextual                        | sem aparência de doceria por padrão  |
| Etiquetas      | exemplos contextuais                               | aviso regulatório preservado         |
| Gastos fixos   | revisão visual neutra                              | paywall preservado                   |
| Planos         | benefícios contextuais sem esconder limites        | preços e gates intactos              |
| Configurações  | seleção de perfil alinhada ao onboarding           | mudança reflete após salvar          |
| Suporte        | textos de recuperação universais                   | não prometer entidade inexistente    |
| Métricas admin | nomes técnicos claros                              | analytics continua com mesmas chaves |

### Onda 5 — auditoria

| Área                  | Verificação                                            |
| --------------------- | ------------------------------------------------------ |
| Estados vazios        | nenhuma imagem alimentar usada como fallback universal |
| Alertas e celebrações | variedade visual; sem brigadeiro como sucesso global   |
| Dark mode             | neutros quentes e contraste AA                         |
| PWA desktop           | nomenclatura idêntica ao mobile e superfícies contidas |
| Acessibilidade        | rótulos falados correspondem ao texto contextual       |
| Loja e screenshots    | demonstrar pelo menos três perfis de negócio           |

## 14. Requisitos de conteúdo

1. Não usar “todo tipo de negócio” junto de um exemplo exclusivamente alimentar.
2. Evitar diminutivos e tom infantil em telas operacionais.
3. Frases devem priorizar ação: cadastrar, vender, acompanhar, receber, repor e calcular.
4. Exemplos contextuais nunca alteram dados já digitados.
5. Emojis só entram quando acrescentam compreensão; não são decoração padrão.
6. “Receita” financeira permanece receita financeira; o contexto deve evitar ambiguidade.

## 15. Acessibilidade

- Contraste mínimo AA em texto, ícone e estados interativos.
- Alvos de toque com pelo menos 44 × 44 px.
- Não depender apenas de cor para estado.
- Textos contextuais também atualizam `accessibilityLabel`.
- Ilustrações decorativas não recebem descrição redundante.
- Nomenclatura dinâmica deve permanecer curta o suficiente para 320–390 px.

## 16. Compatibilidade e dados

- Nenhuma migração de banco é necessária nesta versão.
- Contas existentes usam o `businessType` atual.
- Perfil sem tipo usa fallback neutro.
- Trocar o tipo de negócio não altera receitas, materiais, produtos ou vendas.
- A API continua recebendo os mesmos DTOs.
- Builds whitelabel continuam usando `BrandCopy`; o dicionário contextual complementa a marca,
  sem substituí-la.

## 17. Métricas de sucesso

- Conclusão do onboarding por perfil.
- Cadastro do primeiro produto/serviço.
- Primeiro cálculo de preço.
- Primeira venda registrada.
- Distribuição de perfis sem concentração artificial causada pela ordem da interface.
- Redução de abandono entre seleção do perfil e conclusão do onboarding.

As métricas não justificam adicionar telemetria invasiva. Reutilizar analytics existente quando
possível.

## 18. Estratégia de validação

### 18.1 Automatizada

- Teste unitário do dicionário para cinco perfis e fallback.
- Typecheck dos pacotes tocados.
- Lint mobile.
- Testes mobile existentes.
- Build PWA da marca Lucro Caseiro.

### 18.2 Visual

Capturas mínimas:

- onboarding em 390 px;
- Home com perfil alimentação;
- Home com perfil serviços;
- Receitas/ficha e materiais em dois perfis;
- Finanças em tema claro e escuro;
- PWA em 390, 768 e 1440 px.

### 18.3 Revisão de linguagem

Executar busca final por:

- `Doces da Maria`;
- `brigadeiro`;
- `bolo`;
- `leite condensado`;
- categorias alimentícias fixas;
- `heart` em cabeçalhos operacionais;
- `primaryBg` e rosa hardcoded em grandes superfícies.

Ocorrências legítimas dentro do perfil alimentação, testes específicos ou catálogo de imagens
podem permanecer.

## 19. Ordem de entrega

1. Fundação de cópia contextual e testes.
2. Onboarding.
3. Cadastro/login.
4. Home, Mais e desktop shell.
5. Produtos, venda, agenda, clientes e orçamentos.
6. Receitas/fichas, materiais, embalagens e precificação.
7. Finanças, Insights, catálogo, etiquetas e planos.
8. Estados vazios, alertas, suporte e métricas.
9. Auditoria visual e correções.

Cada etapa deve terminar com:

- arquivos alterados identificados;
- checagem contra mudanças locais não aprovadas;
- validação automatizada proporcional;
- evidência visual quando houver mudança perceptível;
- atualização desta matriz.

## 20. Critérios globais de aceite

- Uma pessoa de serviços não encontra confeitaria como exemplo padrão.
- Uma pessoa de alimentação continua vendo receitas, insumos e rendimento.
- Uma pessoa sem `businessType` recebe linguagem neutra.
- O rosa é reconhecível como marca, mas não domina áreas operacionais.
- Há no máximo uma ação grande preenchida de rosa por viewport.
- Nenhuma regra financeira, limite, rota ou contrato muda por causa do texto.
- Android e PWA apresentam a mesma nomenclatura contextual.
- O build commitado continua funcional com as mudanças locais preservadas.

## 21. Registro de implementação — 2026-07-25

### 21.1 Entregue

| Onda                               | Estado       | Evidência principal                                                                  |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| Fundação                           | implementada | `features/subscription/business-copy.ts` e 7 testes de perfis/fallback               |
| Onboarding                         | implementado | entrada por modo de operação, alimentação por último, exemplo e imagem contextuais   |
| Primeira impressão                 | implementada | posicionamento universal, coração removido da Home, alerta global sem brigadeiro     |
| Navegação                          | implementada | Home, Mais, títulos de rota e desktop shell usam o perfil                            |
| Produtos e pedidos                 | implementada | títulos, exemplos, categorias e encomenda/atendimento contextuais                    |
| Fichas e materiais                 | implementada | lista, criação, edição, detalhes, estatísticas, ícones e PDF contextuais             |
| Embalagens/adicionais              | implementada | listagem, formulário, busca, limites e custos contextuais                            |
| Precificação                       | implementada | calculadoras simples/completa e resultado usam ficha, material e adicional do perfil |
| Finanças e compras                 | implementada | exemplos e categorias contextuais em lançamentos, compras e gastos fixos             |
| Catálogo, etiquetas e fornecedores | implementada | placeholders e descrições acompanham o negócio                                       |
| Planos, limites e suporte          | implementada | benefícios, banners, paywall, confirmação e FAQ contextuais                          |

Não houve migração, alteração de DTO ou reinterpretação dos dados existentes. O valor salvo continua
sendo o `businessType` já suportado pela aplicação.

### 21.2 Uso de cor aplicado

- superfícies e cards permanecem neutros;
- rosa fica concentrado em CTA principal, seleção, foco e pequenos sinais de marca;
- o coração decorativo saiu da saudação da Home;
- o CTA tracejado secundário de embalagens/adicionais deixou de usar fundo rosa;
- os destaques informativos das fichas usam superfície neutra/azul;
- a etapa de nome do onboarding usa a imagem do perfil escolhido, não a etiqueta rosa universal.

### 21.3 Validação observada

- `pnpm --filter @lucro-caseiro/mobile typecheck`: passou;
- `pnpm --filter @lucro-caseiro/mobile lint`: passou;
- `pnpm --filter @lucro-caseiro/mobile test`: 63 arquivos e 387 testes passaram;
- `pnpm --filter @lucro-caseiro/mobile build`: PWA Lucro Caseiro gerada com sucesso;
- capturas do build limpo em 390 × 844 e 1440 × 1000: três etapas do onboarding renderizaram
  sem erro de console em `.aerofortress/tmp/onboarding-audit/`;
- busca final: exemplos universais de brigadeiro, bolo, leite condensado e “Doces da Maria”
  ficaram restritos a testes, catálogo de imagens ou compatibilidade legada.

### 21.4 Limitações da validação

- a credencial E2E configurada respondeu HTTP 400; por isso, as telas autenticadas não receberam
  aprovação visual nesta execução;
- Android não foi aberto nesta execução;
- a auditoria de loja e screenshots com três perfis continua sendo trabalho de publicação, não
  requisito para integrar a fundação no app.

### 21.5 Isolamento das alterações anteriores

Esta implementação usou `48c5783` como referência funcional e preservou os demais diffs locais.
Arquivos que já estavam alterados receberam apenas hunks contextuais; este registro não classifica,
aprova nem incorpora automaticamente essas mudanças anteriores.
