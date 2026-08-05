# PRD — Correções de usabilidade mobile da navegação e cadastros

**Status:** Implementado e validado  
**Data:** 2026-08-03  
**Plataforma validada:** Android, Pixel 7 (`lucro_e2e`), 1080×2400, densidade 420  
**Escopo:** app Lucro Caseiro autenticado em viewport de celular

## 1. Contexto

Uma auditoria exploratória no emulador Android encontrou regressões na convivência entre a
tab bar flutuante e ações fixas das telas, além de falhas de legibilidade com a fonte do sistema
ampliada e expectativas antigas na suíte Maestro.

O problema mais grave está no fluxo Nova Venda: o CTA `Próximo` é renderizado na mesma faixa da
tab bar. No aparelho testado, o botão ocupa `[632,2118][994,2234]` e a barra começa em `y=2148`.
Somente 30 px, cerca de 11,4 dp, permanecem expostos. Um toque no centro do CTA abre `Agenda`.

## 2. Objetivo

Garantir que os fluxos primários do app continuem operáveis e legíveis em um celular Android,
inclusive com fonte do sistema em 130%, sem alterar a arquitetura ou a composição canônica da
barra inferior.

## 3. Problemas confirmados

### P0 — CTA de Nova Venda bloqueado

- Os rodapés fixos dos passos de cliente, produto e pagamento usam um deslocamento constante.
- O deslocamento não considera altura, offset nem safe area da tab bar flutuante.
- Tocar no centro de `Próximo` aciona a aba que está visualmente por cima.

### P1 — Rótulos da tab bar cortados com fonte ampliada

- Com `font_scale=1.3`, os rótulos de `Início`, `Vendas`, `Agenda` e `Mais` são recortados
  verticalmente.
- A navegação precisa preservar rótulo e ícone completos, pois ambos comunicam o destino.

### P1 — Formulário Novo Produto apresenta campo obrigatório parcialmente cortado

- Na abertura do modal, `Informações básicas` e `Preço e custo` começam expandidos.
- O rodapé fixo encerra a área rolável no meio do início do campo obrigatório `Preço de venda`.
- A tela precisa deixar clara a próxima seção sem sugerir que um campo está atrás do CTA.

### P1 — Suíte Maestro não representa a navegação atual

- `03-tabs-navigation.yaml` ainda descreve `Clientes` como a quarta aba.
- A navegação atual é `Início`, `Vendas`, `Nova venda`, `Agenda`, `Mais` quando agendamento está
  habilitado.
- `04-more-navigation.yaml` pode selecionar texto de um item ainda oculto sob a tab bar; o toque
  cai em outro alvo.

### P1 — Voltar de Financeiro perde o contexto do menu Mais

- O atalho de Financeiro em Mais aponta para a rota legada `/finance`.
- Essa rota redireciona para `/tabs/finance` e elimina a origem da pilha; o botão Voltar cai na
  Home, enquanto os demais atalhos retornam a Mais.

## 4. Requisitos funcionais

### RF-01 — Clearance único para ações sobre a tab bar

- Toda ação fixa de Nova Venda deve derivar o deslocamento inferior do helper canônico da tab bar.
- O CTA deve permanecer integralmente acima da superfície flutuante e da safe area.
- A área rolável deve manter espaço para que o último item não fique atrás do rodapé reposicionado.

### RF-02 — Navegação resistente à escala de fonte

- Os cinco rótulos devem permanecer inteiros com a fonte do Android em 130%.
- A solução pode limitar a ampliação apenas nos rótulos compactos da tab bar, preservando a escala
  de fonte no conteúdo das telas.
- Alvos de toque e ícones não podem diminuir.

### RF-03 — Abertura progressiva do cadastro de produto

- Em modal mobile, somente `Informações básicas` começa expandida.
- `Preço e custo` permanece visível como cabeçalho da próxima seção e pode ser expandida com um
  toque.
- No desktop e no formulário fora de modal, o comportamento atual pode permanecer.
- O rodapé `Cadastrar produto` continua fixo, seguindo o padrão dos demais modais de formulário.

### RF-04 — Maestro alinhado ao produto atual

- A suíte deve validar `Agenda` na quarta aba quando a configuração testada oferece agendamento.
- O menu `Mais` deve rolar `Produtos` para uma região livre da tab bar antes de tocar.
- As asserções devem usar textos exclusivos das telas de destino.

### RF-05 — Financeiro preserva a origem da navegação

- A rota de pilha `/finance` deve renderizar o dashboard diretamente, sem redirecionar para uma
  aba interna.
- Ao voltar, a pessoa deve retornar ao menu Mais na posição anterior.

### RF-06 — Resumo financeiro legível com fonte ampliada

- O valor principal deve poder reduzir o tamanho para caber em uma linha.
- A composição `entradas · despesas` pode ocupar até duas linhas sem perder informação.

## 5. Critérios de aceite

1. Em Nova Venda, após adicionar um produto, tocar no centro de `Próximo` avança para pagamento;
   não troca de aba.
2. O retângulo do rodapé fixo termina acima do início da tab bar em Android.
3. Com `font_scale=1.3`, os rótulos das cinco abas permanecem visíveis por inteiro.
4. Ao abrir Novo Produto no celular, `Preço e custo` aparece recolhida e integralmente identificada.
5. Com fonte em 130%, o card `Lucro em <mês>` não perde o valor de entradas ou despesas.
6. Os fluxos Maestro de abas e menu Mais passam na navegação atual.
7. Abrir Financeiro pelo menu Mais e voltar retorna ao próprio menu, não à Home.
8. Typecheck, lint direcionado e testes relevantes do mobile passam.
9. A fonte e as demais configurações do emulador são restauradas após a validação.

## 6. Não objetivos

- Redesenhar a identidade visual da tab bar.
- Alterar a ordem canônica das cinco abas.
- Reformular cards de Vendas, Agenda ou Produtos.
- Modificar regras de negócio, dados da conta ou API.
- Criar uma nova biblioteca de layout ou uma segunda implementação de modal.

## 7. Evidências da auditoria

- `.aerofortress/lucro-sale-step1-added.png`
- `.aerofortress/lucro-sale-cta-tap.png`
- `.aerofortress/lucro-product-form.png`
- `.aerofortress/lucro-font130-late.png`
- `apps/mobile/.maestro/flows/03-tabs-navigation.yaml`
- `apps/mobile/.maestro/flows/04-more-navigation.yaml`

## 8. Plano de validação

1. Rodar lint e typecheck do mobile.
2. Rodar testes unitários relacionados ao layout, quando existentes.
3. Executar os fluxos Maestro de navegação principal e menu Mais.
4. Repetir manualmente Nova Venda no Pixel 7 e tocar no centro de `Próximo`.
5. Repetir a Home com `font_scale=1.3`, capturar a tela e restaurar `font_scale=1.0`.

## 9. Resultado da implementação

- O CTA de Nova Venda termina em `y=2061`; a tab bar começa em `y=2148`, deixando 87 px de
  separação. O fluxo Maestro 21 avançou até `Forma de pagamento` com saída 0.
- Em `font_scale=1.3`, os cinco rótulos da tab bar, o valor de lucro e a composição de entradas e
  despesas permaneceram inteiros. O emulador foi restaurado para `font_scale=1.0` e
  `show_ime_with_hard_keyboard=0`.
- O modal Novo Produto abriu com `Preço e custo` recolhido e identificado acima do rodapé fixo.
- A rota de pilha `/finance` passou a renderizar o dashboard diretamente; voltar retornou ao menu
  Mais. O fluxo Maestro 04 passou por Produtos, Financeiro e Receitas com saída 0.
- O fluxo Maestro 03 passou por Vendas, Agenda, Mais e Home com saída 0.
- Lint direcionado, typecheck e Prettier passaram. A suíte mobile passou com 71 arquivos e 420
  testes.

Evidências posteriores aos ajustes:

- `.aerofortress/lucro-sale-payment.png`
- `.aerofortress/lucro-font130-after-loaded.png`
- `.aerofortress/lucro-product-form-after2.png`
- `.aerofortress/lucro-finance-stack-back2.png`
- `apps/mobile/.maestro/flows/21-new-sale-mobile-cta.yaml`
