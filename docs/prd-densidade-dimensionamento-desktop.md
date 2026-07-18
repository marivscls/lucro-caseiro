# PRD — Densidade e dimensionamento da PWA no desktop

> Data: 2026-07-17 · Status: em implementação · Escopo: PWA autenticada em viewports desktop

## Contexto

A adaptação desktop da PWA já possui shell, sidebar e cabeçalho próprios, mas parte das telas internas ainda amplia diretamente a composição mobile. Em monitores largos, campos, seletores, áreas de upload e botões passam a ocupar quase toda a largura disponível, criando controles visualmente gigantes e percursos longos de leitura e ponteiro.

O problema foi observado primeiro nos CTAs de Precificação e Produtos e reaparece no formulário “Novo produto”: campos chegam a aproximadamente 1.850 px, seletores binários viram duas faixas de quase metade da tela e áreas simples de upload e descrição ocupam largura excessiva.

Este PRD define uma regra transversal de densidade para desktop. A implementação deve ser responsiva sobre `apps/mobile`, sem alterar a experiência mobile já aprovada.

## Problema

Hoje, algumas telas usam `width: 100%`, `flex: 1` e alturas pensadas para toque como regras universais. Isso gera no desktop:

- formulários sem largura máxima e com baixa legibilidade;
- CTAs primários em formato de faixa de ponta a ponta;
- escolhas de duas opções desproporcionalmente largas;
- campos curtos, como preço e quantidade, ocupando espaço de texto longo;
- modais e cadastros em tela cheia sem contenção do conteúdo;
- excesso de espaço vazio dentro de controles, cards e áreas de upload;
- inconsistência entre telas corrigidas individualmente e telas equivalentes ainda ampliadas.

## Inventário confirmado em código

A auditoria estática de 2026-07-17 confirmou que a pendência não se limita ao cadastro de produto. Os fluxos abaixo ainda reutilizam formulários, seletores, uploads, CTAs ou superfícies modais mobile sem contenção desktop suficiente.

| Família   | Telas e fluxos confirmados                                             | Pendência principal                                                 |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Entrada   | Entrar, Criar conta, Redefinir senha e Primeiros passos                | Formulários, escolhas e CTAs sem largura máxima desktop             |
| Início    | Meta de pró-labore                                                     | Modal e ações em largura total                                      |
| Vendas    | Nova venda, filtros/detalhes/edição de Vendas e Agenda                 | Etapas, cards de escolha, barras fixas, formulários e modais mobile |
| Cadastros | Editar produto, Clientes, Insumos, Receitas, Embalagens e Fornecedores | Formulários de criar/editar e uploads sem zona operacional          |
| Operação  | Compras, Financeiro, Gastos fixos e Orçamentos                         | Formulários, seletores segmentados e CTAs esticados                 |
| Presença  | Rótulos e Catálogo online                                              | Edição, exportação, uploads e personalização em largura total       |
| Conta     | Configurações                                                          | Editar perfil e meta de pró-labore sem contenção                    |
| Residuais | Planos, Suporte e drawer de Fiado                                      | Cards/CTAs de ponta a ponta e action sheet mobile no desktop        |

Já estavam adaptados no momento da auditoria: cadastro de **Novo produto**, calculadora de **Precificação**, tabelas desktop de **Vendas** e **Clientes**, grade principal de **Produtos** e grade de **Mais opções**. Em Produtos, apenas o fluxo de edição/detalhe permanecia pendente.

### Matriz de implementação

- **Zona compacta (até 360 px):** dinheiro, quantidade, percentual, data e códigos curtos.
- **Zona padrão (até 720 px):** autenticação, nome, categoria, telefone, seletores e modais simples.
- **Zona ampla (até 960 px):** descrição, personalização, edição composta e modais complexos.
- **Zona operacional (até 1.040 px):** formulários completos e wizards.
- **Zona de dados (até 1.280 px):** cards comparativos, tabelas e listagens.
- **Ações:** 160–240 × 44 px, alinhadas ao contexto; botões em linha podem compartilhar uma barra de até 520 px.
- **Modais:** conteúdo centralizado; bottom sheets mobile tornam-se painéis centrais ou drawers de até 720 px no desktop.

## Objetivo

Criar uma linguagem de dimensionamento desktop consistente para formulários, ações, seletores, uploads, modais, listas e detalhes, reduzindo a escala dos controles sem reduzir legibilidade, acessibilidade ou capacidade funcional.

## Implementação em andamento

- As faixas compacta, padrão, ampla, operacional e de dados foram centralizadas em `desktop-density.ts`.
- Autenticação e onboarding agora usam zonas de 480–720 px no desktop.
- Formulários e edições de Produtos, Clientes, Fornecedores, Compras, Financeiro, Gastos fixos, Insumos, Receitas, Embalagens, Encomendas, Orçamentos, Rótulos, Catálogo e Configurações foram contidos entre 720 e 1.040 px.
- CTAs primários de formulário passaram a usar 220–240 × 44 px no desktop quando a ação não depende de uma barra operacional.
- Filtros de Vendas e ações de Fiado passaram de bottom sheets para painéis centrais no desktop; o comportamento mobile foi mantido.
- Planos e Suporte agora limitam a zona de leitura e compactam os CTAs no desktop.
- A regra é condicional ao breakpoint desktop existente de 1.024 px; abaixo dele os helpers não injetam estilo.
- **Validação visual reaberta em 2026-07-17:** capturas de detalhe/edição de encomenda, Novo cliente, Editar cliente e Editar insumo provaram que a primeira aplicação não limitou as superfícies reais. O PRD só volta a “implementado” após correção das superfícies e auditoria visual representativa.

### Resultados esperados

- O conteúdo operacional fica visualmente agrupado e fácil de percorrer em monitores de 1.024 a 1.920 px.
- O tamanho de cada controle é definido pela natureza da informação, não pela largura total da viewport.
- Ações primárias deixam de parecer barras de navegação.
- Telas equivalentes usam as mesmas faixas de largura e altura.
- O mobile permanece visual e funcionalmente inalterado.

## Não objetivos

- Redesenhar a identidade visual, cores, tipografia ou ícones.
- Alterar regras de negócio, validações, textos ou ordem dos fluxos.
- Reorganizar a navegação ou o shell desktop.
- Transformar todos os formulários em modais.
- Criar uma segunda implementação separada para web.
- Reduzir fontes ou áreas de toque no Android/iOS.

## Princípios de produto e UX

1. **Conteúdo determina largura.** Preço, data e quantidade não devem ocupar a mesma largura de uma descrição.
2. **Desktop não é mobile ampliado.** A composição interna deve usar contenção, colunas e ações compactas a partir de 1.024 px.
3. **Uma ação tem peso, não volume.** O CTA principal deve ser fácil de localizar sem dominar toda a tela.
4. **Densidade não sacrifica acessibilidade.** Texto, foco, navegação por teclado, contraste e estados continuam preservados.
5. **Mobile é o baseline.** Abaixo do breakpoint desktop, dimensões e composição atuais não devem mudar.
6. **Reuso antes de duplicação.** Componentes compartilhados existentes devem ser estendidos quando a regra se repetir; não criar variantes paralelas para a mesma função.

## Breakpoints e zonas de conteúdo

### Mobile e tablet — abaixo de 1.024 px

- Manter o layout atual.
- CTAs podem continuar com largura total.
- Alvos de toque devem continuar com pelo menos 48 × 48 dp.
- Nenhuma regra desktop pode vazar para Android, iOS ou web estreita.

### Desktop — a partir de 1.024 px

As larguras abaixo são tetos, não tamanhos obrigatórios:

| Zona        | Uso                                                     | Largura máxima de referência |
| ----------- | ------------------------------------------------------- | ---------------------------: |
| Compacta    | preço, quantidade, percentual, data, código curto       |                       360 px |
| Padrão      | nome, categoria, telefone, select e busca de formulário |                       720 px |
| Ampla       | descrição, composição complexa e grupos de campos       |                       960 px |
| Operacional | formulário completo, detalhe e wizard                   |                     1.040 px |
| Dados       | tabelas, grades e listagens densas                      |                     1.280 px |

Regras gerais:

- O conteúdo principal deve ficar centralizado ou alinhado ao início da área útil do shell, com espaçamento lateral de 24 a 40 px.
- Um formulário não deve crescer além de 1.040 px só porque há espaço disponível.
- Tabelas e grades podem usar até 1.280 px quando a informação realmente se beneficia da largura.
- Em telas entre 1.024 e 1.199 px, as zonas devem encolher fluidamente sem criar rolagem horizontal.
- Campos relacionados podem formar duas colunas; a ordem de leitura e de tabulação deve continuar lógica.

## Requisitos funcionais

### RF-01 — Contenção de formulários

- Todo cadastro e edição autenticados devem ter um contêiner desktop com largura máxima de 1.040 px.
- Campos devem usar a menor zona compatível com seu conteúdo.
- Labels, mensagens de erro e ajuda devem permanecer ligados ao respectivo campo.
- O formulário pode continuar em uma coluna quando isso facilitar a leitura; contenção não obriga grid.

### RF-02 — Campos de entrada

- Inputs e selects de uma linha devem ter altura visual entre 44 e 48 px no desktop.
- Campos compactos devem ter no máximo 360 px; campos padrão, no máximo 720 px.
- Textareas devem ter largura máxima de 960 px e altura inicial entre 96 e 128 px, crescendo quando necessário.
- Ícones auxiliares não devem aumentar a altura total do campo e devem manter foco/tooltip ou rótulo acessível.
- Estados de foco, erro, desabilitado e preenchido devem continuar visíveis.

### RF-03 — Botões e CTAs

- A ação primária desktop deve usar como referência 180 × 44 px.
- A largura normal permitida é de 160 a 240 px, conforme o texto; não usar `flex: 1` nem largura total por padrão.
- CTAs devem ficar alinhados ao contexto: à direita no rodapé do formulário, próximos ao bloco que confirmam ou na toolbar da listagem.
- Botões secundários devem ter a mesma altura do primário e largura definida pelo conteúdo.
- Botões somente com ícone devem ter área interativa mínima de 40 × 40 px no desktop e nome acessível.
- Largura total no desktop só é permitida quando o próprio conteúdo exige uma ação única de ocupação integral, com justificativa registrada no componente.

### RF-04 — Seletores binários e segmentados

- Grupos como “Produto simples / Produto composto” e “Por unidade / Por quilo” devem ter largura máxima de 720 px.
- Cada opção deve ter altura entre 44 e 48 px.
- O grupo pode dividir o espaço igualmente, mas não pode crescer até a largura total da viewport.
- Ícone, texto, seleção e foco devem continuar perceptíveis.

### RF-05 — Uploads e mídia

- O seletor da foto principal deve ter largura máxima de 480 px e altura entre 88 e 112 px no desktop.
- Miniaturas adicionais devem usar quadrados de 80 a 96 px.
- Instruções de formato e limite devem continuar visíveis sem criar uma faixa de ponta a ponta.
- Arrastar e soltar no PWA pode ser preservado quando já existir, mas não é requisito novo deste PRD.

### RF-06 — Modais, drawers e telas de cadastro

- Modais simples devem ter largura máxima de 720 px.
- Modais ou cadastros complexos podem usar até 960 px.
- Quando a rota continuar em tela cheia, seu conteúdo interno deve obedecer à zona operacional de 1.040 px.
- Cabeçalho, fechar/voltar e rodapé de ações devem se alinhar ao mesmo contêiner do formulário.
- No desktop autenticado, o shell continua sendo o único dono do título da rota; cabeçalhos internos mobile não devem duplicá-lo.

### RF-07 — Listas, grades e barras de ação

- Barras de filtros, busca e ações devem usar controles compactos e altura coerente entre 40 e 48 px.
- O CTA de criação deve ficar na toolbar ou no rodapé contextual, sem virar faixa fixa de largura total.
- Cards de lista devem usar altura determinada pelo conteúdo; não esticar itens apenas para preencher uma linha.
- Paginação e contagem devem permanecer próximas à listagem e dentro da zona de dados.

### RF-08 — Aplicação transversal

A correção não será considerada concluída após ajustar somente a tela usada como exemplo. A implementação deve auditar, no mínimo:

- Produtos, novo/editar produto e kits;
- Precificação e histórico;
- Insumos, receitas e embalagens;
- Vendas, nova venda, orçamentos e fiado;
- Clientes, fornecedores e compras;
- Financeiro, entradas/saídas e gastos fixos;
- Agenda, catálogo, rótulos e insights;
- Configurações, planos e suporte;
- modais e formulários acessados a partir dessas rotas.

## Tela piloto — Novo produto

A tela mostrada pela dona do produto será a referência inicial da implementação.

No desktop:

- título e ações devem se alinhar ao contêiner operacional;
- nome e categoria usam a zona padrão de até 720 px;
- os dois seletores binários usam até 720 px e altura máxima de 48 px;
- preço usa a zona compacta de até 360 px;
- upload principal usa até 480 × 112 px;
- miniaturas adicionais usam 80 a 96 px;
- descrição usa até 960 × 128 px inicialmente;
- código de barras usa a zona padrão, com ação auxiliar compacta;
- salvar/cancelar usam botões compactos e alinhamento contextual;
- nenhuma mudança deve atingir a composição mobile da mesma tela.

## Critérios de aceite

### Gerais

- [ ] Nenhum formulário autenticado ultrapassa 1.040 px de largura útil no desktop, salvo exceção documentada de tabela/grade.
- [ ] Nenhum CTA primário de formulário ou listagem usa largura total no desktop sem exceção justificada.
- [ ] Campos curtos respeitam a zona compacta de até 360 px.
- [ ] Campos de texto comuns respeitam a zona padrão de até 720 px.
- [ ] Seletores binários não ultrapassam 720 px nem 48 px de altura.
- [ ] Áreas de upload não se transformam em faixas de ponta a ponta.
- [ ] O título da rota não aparece simultaneamente no shell e no conteúdo da página.
- [ ] Não existe rolagem horizontal nas larguras suportadas.

### Acessibilidade e interação

- [ ] Todos os controles são alcançáveis por teclado no PWA e exibem foco visível.
- [ ] A ordem de tabulação acompanha a ordem visual e lógica do formulário.
- [ ] Labels, mensagens de erro e nomes acessíveis permanecem presentes.
- [ ] Zoom de navegador em 125% não corta conteúdo nem sobrepõe ações.
- [ ] Android e iOS mantêm alvos de toque de pelo menos 48 × 48 dp.

### Responsividade

- [ ] Capturas comparativas aprovadas em 1.024 × 768, 1.280 × 800, 1.440 × 900 e 1.920 × 1.080.
- [ ] A composição continua funcional em 768 × 1.024 e 390 × 844.
- [ ] A comparação visual mobile não apresenta regressões de dimensão, espaçamento ou ordem.
- [ ] Tema claro e escuro permanecem legíveis nas duas famílias de viewport.

## Estratégia de implementação

### Etapa 1 — Inventário e regra canônica

- Localizar componentes existentes de campo, botão, modal, upload e layout antes de criar estilos novos.
- Mapear usos de `width: 100%`, `flex: 1`, `minHeight: 56` e CTAs fixos nas rotas autenticadas.
- Adicionar a menor quantidade possível de tokens ou propriedades responsivas compartilhadas.
- Só generalizar uma regra quando houver repetição real; ajustes exclusivos permanecem locais à tela.

### Etapa 2 — Piloto em Novo produto

- Aplicar as zonas de conteúdo e dimensões deste PRD.
- Validar visualmente nas quatro larguras desktop e em uma viewport mobile.
- Usar o resultado aprovado como referência para formulários equivalentes.

### Etapa 3 — Varredura transversal

- Corrigir formulários e modais.
- Corrigir seletores, uploads e campos de valor.
- Corrigir CTAs e toolbars de listas.
- Revisar cada rota da lista do RF-08, sem encerrar por amostragem.

### Etapa 4 — Validação

- Executar testes, TypeScript, lint e export PWA.
- Realizar navegação autenticada por todas as rotas auditadas.
- Registrar capturas desktop e mobile das telas representativas.
- Comparar medidas reais dos controles com os limites do PRD.

## Métricas de sucesso

- 100% das rotas autenticadas do RF-08 auditadas.
- Zero CTA mobile de largura total reaproveitado sem adaptação no desktop.
- Zero formulário com largura útil acima de 1.040 px sem exceção registrada.
- Zero regressão visual confirmada no mobile.
- Redução perceptível do deslocamento do ponteiro e da dispersão visual nos formulários em 1.920 px.

## Riscos e mitigação

| Risco                                           | Mitigação                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| Compactação vazar para mobile                   | Isolar regras no breakpoint de 1.024 px e exigir comparação mobile.          |
| Criar dezenas de estilos locais inconsistentes  | Estender componentes canônicos já usados quando a regra for transversal.     |
| Aplicar um único `maxWidth` a qualquer conteúdo | Usar as cinco zonas conforme o tipo de informação.                           |
| Tornar controles pequenos demais                | Manter alturas, foco e tipografia definidos neste PRD; não compactar fontes. |
| Corrigir apenas as capturas reportadas          | Usar a lista obrigatória do RF-08 e evidência visual por família de tela.    |

## Definição de pronto

O trabalho estará pronto quando todas as rotas do RF-08 tiverem sido auditadas, os critérios de aceite estiverem comprovados e as capturas mostrarem uma PWA desktop compacta e coerente em diferentes larguras, sem qualquer alteração perceptível ou funcional na experiência mobile.
