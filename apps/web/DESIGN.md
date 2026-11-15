---
name: Lucro Caseiro — site público
description: Landing e páginas públicas na identidade "Profissional Quente" do app; vinho, creme e uma conta de verdade.
colors:
  wine: "#4a2332"
  rose: "#b65f72"
  rose-fill: "#a85a67"
  rose-soft: "#f5e5e8"
  lime: "#dce86a"
  mint-bg: "#e3f2ea"
  mint-text: "#2a7050"
  gold: "#d4a054"
  paper: "#faf8f6"
  sheet: "#ffffff"
  surface: "#f5f3f1"
  ink: "#24181e"
  muted: "#6d6266"
  line: "#e9e5e2"
  on-wine: "#faf8f6"
  on-wine-muted: "#e9c9d0"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(40px, 4.6vw, 68px)"
    fontWeight: 700
    lineHeight: 1.09
    letterSpacing: "-0.04em"
    fontFeature: '"ss01"'
  headline-lg:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(32px, 3.6vw, 52px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.035em"
    fontFeature: '"ss01"'
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(30px, 3vw, 44px)"
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: "-0.035em"
    fontFeature: '"ss01"'
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(22px, 2vw, 28px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
    fontFeature: '"ss01"'
  money:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(32px, 3vw, 44px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: '"ss01", "tnum"'
  body-lg:
    fontFamily: "Manrope, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: '"ss01"'
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
    fontFeature: '"ss01"'
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
    fontFeature: '"ss01"'
rounded:
  pill: "999px"
  radius-lg: "32px"
  panel-compact: "24px"
  radius: "20px"
  chip: "16px"
  mark: "12px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  2xl: "56px"
  3xl: "72px"
  section: "88px"
components:
  button-primary:
    backgroundColor: "{colors.rose-fill}"
    textColor: "{colors.sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
  button-outline-on-wine:
    backgroundColor: "transparent"
    textColor: "{colors.on-wine}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    height: "48px"
  button-outline-on-wine-hover:
    backgroundColor: "{colors.rose-fill}"
  button-plan:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "56px"
  button-plan-hover:
    backgroundColor: "{colors.surface}"
  receipt-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-lg}"
    padding: "28px"
  profit-chip:
    backgroundColor: "{colors.mint-bg}"
    textColor: "{colors.mint-text}"
    rounded: "{rounded.chip}"
    padding: "14px"
  plan-card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "28px"
  plan-card-featured:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.on-wine}"
    rounded: "{rounded.radius}"
    padding: "28px"
  plan-badge:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.wine}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  saving-badge:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.wine}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  period-toggle-active:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.on-wine}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
    height: "48px"
  screen-panel:
    backgroundColor: "{colors.rose-soft}"
    rounded: "{rounded.radius-lg}"
    padding: "32px 32px 0"
    height: "420px"
  journey-mark:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.on-wine}"
    rounded: "{rounded.pill}"
    size: "40px"
---

# Design System: Lucro Caseiro — site público

## Overview

**Creative North Star: "Profissional Quente"**

O site público não tem mundo visual próprio: é a identidade do app (ADR-0008, `docs/designs/design-system/DESIGN.md`) levada para a web. Este arquivo registra como essa identidade se materializou no build entregue da landing (`/`) e nas páginas internas que compartilham os tokens declarados em `.page` (`src/features/landing/landing-page.module.css`). Quando o app e este arquivo divergirem em algo que não seja específico da web, vale o DESIGN.md do app.

A página abre numa faixa vinho opaca, de borda a borda, que contém o cabeçalho, a promessa e uma ficha creme com a conta completa de um produto (custos, custo total, preço sugerido, sobra). Depois da faixa, tudo é creme: seções separadas por espaço e por hairlines, capturas reais do app em painéis rose suave, ações em pílulas rose. O vinho volta como superfície cheia só em pontos de decisão (plano em destaque, moldura do vídeo, bloco final). A densidade é de documento, não de vitrine: colunas largas de texto curto, números grandes, nada flutuando sobre nada.

O sistema é plano. Profundidade vem de troca de superfície (vinho, creme, branco, rose suave) e de bordas hairline, nunca de sombra, gradiente ou vidro. O movimento é curto e começa de um quadro já legível.

**Key Characteristics:**

- Uma família só, Manrope, com `ss01` ligado em toda a página; 800 apenas em dinheiro.
- Faixa vinho no topo, creme no resto; vinho cheio reaparece só em blocos de decisão.
- Hairline `line` (1px) como divisor universal; tracejado só dentro da ficha da conta.
- Raios largos (20–32px) em painéis, pílula (999px) em toda ação e selo.
- Capturas reais do app em painéis rose suave, nunca mockups inventados.
- Texto mínimo 16px, alvos mínimos 48px, foco visível de 3px.

## Colors

Paleta quente e contida: um vinho profundo como marca, um rose queimado para agir, um lima ácido para responder e neutros creme levemente rosados.

### Primary

- **Vinho do Logo** (wine): a cor da marca. Fundo da faixa do topo, do plano em destaque, do bloco final e da moldura do vídeo; cor de todos os títulos sobre creme; preenchimento dos números dos passos e do botão ativo do seletor Mensal/Anual.
- **Rose de Ação** (rose-fill): preenchimento de todo botão principal e de links de texto sobre creme (`textLink`, e-mail das dúvidas), linha de progresso da jornada, ícones de seta e de abrir/fechar. É o rose escurecido do app (`primaryInteractive`) para garantir AA com texto branco.
- **Rose Queimado** (rose): o rose de assinatura, sem texto em cima. Usado só como traço (barra de progresso dos capítulos do vídeo).
- **Rose Suave** (rose-soft): fundo dos painéis que seguram capturas do app e do capítulo ativo do vídeo.

### Secondary

- **Lima do Pingo** (lime): o acento de resposta. Destaca a última linha do título do hero ("de cada venda.", com traço desenhado à mão) e do bloco final ("Coloque isso no preço."); também é a seleção de texto, o anel de foco sobre vinho, o hover dos links sobre vinho, o selo "Mais vantajoso" do plano anual e o ícone de reprodução do vídeo.

### Tertiary

- **Menta do Lucro** (mint-bg com mint-text): o par semântico de lucro e confirmação. Fundo e texto do chip "Sobra por caixa"; `mint-text` sozinho colore os checks das listas de recursos. É uma menta escurecida em relação ao `#6BBF96` do app, para que o texto passe AA.
- **Dourado de Plano** (gold): só no selo do plano em destaque, com texto vinho.

### Neutral

- **Creme Canvas** (paper): fundo da página, da ficha da conta, do menu compacto e do cabeçalho flutuante das páginas internas.
- **Branco Folha** (sheet): cartões de plano, seção do vídeo, legendas das capturas, texto sobre rose.
- **Superfície** (surface): hover de botões secundários e capítulos; fundo do selo de tempo do vídeo.
- **Tinta** (ink): texto principal; também o hover do botão principal.
- **Cinza Quente** (muted): textos de apoio, descrições, rótulos da ficha.
- **Hairline** (line): toda borda e divisor de 1px; o trilho apagado da jornada.
- **Creme sobre Vinho** (on-wine) e **Rosa Claro sobre Vinho** (on-wine-muted): texto principal e de apoio dentro de superfícies vinho; on-wine-muted também contorna o botão do cabeçalho vinho.

### Named Rules

**The Faixa Vinho Rule.** Vinho como superfície cheia só aparece em blocos de decisão: a faixa do topo, o plano em destaque, a moldura do vídeo e o bloco final. Entre eles a página é creme.

**The Lima Responde Rule.** Lima marca a resposta, não decora: no máximo um trecho de título por bloco, mais os usos funcionais listados acima. Nunca lima como texto sobre creme ou branco (sem contraste).

**The Uma Pílula Rose Rule.** No máximo um botão preenchido de rose por viewport. Sobre a faixa vinho, o botão do cabeçalho é contornado para que o do hero seja o único cheio.

**The Hairline sobre Vinho Rule.** Divisores dentro do vinho usam o creme translúcido (16–20%), nunca a hairline `line`, que some no fundo escuro.

## Typography

**Display Font:** Manrope (com sans-serif), carregada em `src/app/landing/layout.tsx` como `--font-sans`, pesos 400–800.
**Body Font:** Manrope.

**Character:** Uma família humana e geométrica fazendo tudo, com títulos apertados (−0,035em, −0,04em no hero) e corpo folgado (1,6–1,65). A hierarquia vem de tamanho e peso, nunca de troca de fonte, caixa alta ou espaçamento aberto.

### Hierarchy

- **Display** (700, clamp 40–68px, 1,09): só o título do hero, em três linhas; no celular vai a clamp(36px, 9,2vw, 50px).
- **Headline grande** (700, clamp 32–52px, 1,12): títulos de seção que abrem uma história (jornada; o vídeo usa a mesma ordem, até 48px).
- **Headline** (700, clamp 30–44px, 1,16, máx. 23ch): títulos das demais seções, em vinho.
- **Title** (700, clamp 22–28px, 1,2): títulos dos passos da jornada; cartões de plano (24px) e itens do problema (21px) ficam nessa faixa.
- **Money** (800, clamp 32–44px, 1, tabular): preço sugerido, preços de plano, valor do chip de sobra (28px).
- **Body grande** (400, 19px, 1,65, máx. 42ch): o texto do hero.
- **Body** (400, 17px, 1,65; 16px em listas e notas): textos de seção, em `muted`, máx. 36–58ch.
- **Label** (600–700, 16px): botões, rótulos de passo, selos, links de rodapé, perguntas.

### Named Rules

**The Dinheiro em 800 Rule.** ExtraBold (800) só em valores em reais, sempre com números tabulares. Títulos param em 700.

**The Piso de 16px Rule.** Nenhum texto abaixo de 16px, em nenhum breakpoint. Selos e legendas também.

## Layout

Coluna central `--gutter`: `min(100% − 112px, 1200px)`, estreitando para 64px de margem até 1180px, `min(100% − 40px, 680px)` até 880px e `100% − 32px` até 560px. Faixas de fundo cheio (vinho) vão de borda a borda; o conteúdo dentro delas respeita a mesma coluna.

Seções empilham com respiro de 72–88px no desktop e 56–64px no celular. Composições em duas colunas assimétricas (0,8–1,2fr) colocam o argumento à esquerda e a prova à direita (hero com a ficha, problema, dúvidas); colapsam em uma coluna até 880px. Cartões de plano em duas colunas iguais (Gratuito e Premium, desde 2026-11-15) com 16px de vão, nomes, descrições e preços em linhas de base iguais.

A jornada de três passos usa subgrid: cada passo ocupa quatro linhas (número, título, texto, captura) para que tudo se alinhe entre colunas. Abaixo de 900px vira lista vertical com a captura à direita do texto e, abaixo de 560px, a captura desce para baixo do texto.

No celular a ficha da conta sobe para logo depois do botão principal e as linhas de custo vêm antes do resultado; os links alternativos descem para depois da ficha.

Breakpoints observados: 1180, 1050 (navegação vira menu compacto), 900/899 (jornada e vídeo empilham), 880, 560.

## Elevation & Depth

Plano. Nenhuma superfície da página tem sombra de profundidade. A separação vem de três camadas tonais (vinho > creme > branco, com rose suave e superfície como variações) e da hairline de 1px. A única `box-shadow` estrutural é o truque de pintura da faixa do cabeçalho vinho (`0 0 0 100vmax` com `clip-path`), que estende a cor até as bordas e não cria elevação.

### Named Rules

**The Plano por Padrão Rule.** Superfícies não flutuam. Para destacar, troque a superfície (creme → branco → vinho), não adicione sombra.

## Shapes

Cantos largos e macios em tudo que é painel: 32px nos painéis grandes (ficha da conta, painéis de captura, seção do vídeo, bloco final), 20px em cartões de plano, dispositivos e menu, reduzindo para 24px (painéis grandes) e 14–16px (capturas) no celular. Toda ação, selo, seletor e cabeçalho flutuante é pílula (999px). Marcadores numéricos e o fundo da seta do CTA são círculos. O logo tem 12px de raio. Capturas do app aparecem com só o topo arredondado, cortadas pela base do painel, como um celular saindo da moldura.

## Components

### Buttons

Pílulas firmes, altas e de texto bold; a ação nunca é ambígua.

- **Shape:** pílula (999px), altura mínima 56px (48px no cabeçalho).
- **Primary:** rose-fill com texto branco, 16px/700, 12px × 22px. No cabeçalho flutuante leva uma seta em círculo translúcido.
- **Hover / Focus:** hover troca o fundo para tinta e sobe 2px (só com ponteiro fino e movimento permitido); seta anda 3px. `:active` reduz a 0,98. Foco: contorno de 3px rose-fill a 5px de distância; lima sobre vinho.
- **Contornado sobre vinho:** transparente com borda on-wine-muted; hover preenche de rose-fill.
- **Botão de plano:** transparente com borda hairline e texto tinta, conteúdo nas pontas; no plano em destaque vira rose-fill.
- **Alternativa discreta:** link sublinhado (offset 4px) com 48px de alvo, em on-wine-muted ou muted, logo abaixo do botão.

### Chips

- **Chip de sobra:** menta, 16px de raio, rótulo 16px e valor 800 tabular.
- **Selos:** pílula; dourado com vinho para o plano em destaque, lima com vinho para a economia anual.
- **Seletor Mensal/Anual:** trilho branco com borda hairline; opção ativa em vinho com texto creme (`aria-pressed`).

### Cards / Containers

- **Ficha da conta (assinatura):** creme sobre a faixa vinho, 32px de raio, 28px de respiro; cabeçalho com ícone rose e divisor tracejado; linhas de custo rótulo/valor com valores 600 tabulares; hairline antes do custo total; preço sugerido em Money ao lado do chip de sobra; nota de rodapé em muted. Sempre rotulada "Exemplo ilustrativo".
- **Cartão de plano:** branco, borda hairline, 20px de raio, 28px de respiro, lista separada por hairline com checks menta. Destaque: vinho cheio, textos em on-wine-muted.
- **Painel de captura:** rose suave, 32px de raio, altura fixa (420px; 320/300px no celular), captura centralizada a até 260px com legenda branca encostada na base.
- **Bloco final:** vinho cheio, 32px de raio, 56px de respiro, título com a segunda linha em lima.

### Navigation

- **Cabeçalho sobre vinho (landing):** grade de três colunas (marca, links, ação), 88px de altura, links 500 em creme com sublinhado que se desenha da esquerda (2px, 160ms) no hover e no foco.
- **Cabeçalho flutuante (páginas internas):** pílula creme fixa com borda hairline, 64px, links em muted, hover rose-fill.
- **Compacto (até 1050px):** `details` nativo "Menu" em pílula contornada; abre um painel creme de 20px de raio com links de 48px.
- **Rodapé:** mapa do site em quatro colunas (duas no celular) com títulos em tinta 700 e links em muted de 48px.

### Jornada de três passos (signature)

Três passos (Calcular → Cadastrar → Compartilhar) ligados por uma linha de 2px: trilho em hairline, progresso em rose-fill que se desenha com a rolagem (GSAP ScrollTrigger, scrub 0,8, sem fixar a tela). Horizontal a partir de 900px, trilho vertical à esquerda abaixo disso, terminando no terceiro número. Os números são círculos de 40px; o 2 e o 3 começam apagados (hairline com número vinho) e acendem em vinho quando a linha chega; as capturas sobem 40px dentro do painel. Sem JavaScript ou com movimento reduzido, tudo aparece no estado final.

### Lista de índice

Três colunas (No app, Para quem, Guias) com título vinho sobre divisor vinho de 1px e itens separados por hairline; itens com link ganham seta rose-fill que anda 4px no hover.

### Perguntas

`details` nativos entre hairlines, pergunta 17px/600, chevron rose-fill que gira 180° (180ms).

### Movimento

Easing único `cubic-bezier(0.23, 1, 0.32, 1)`. Estados em 160–240ms. Entrada do hero em 800ms a partir de opacidade 0,4 e 12–16px abaixo, linhas do título escalonadas em 80ms, linhas da ficha em 70ms; o traço lima sob o título se desenha em 900ms. `prefers-reduced-motion: reduce` desliga toda animação e transição.

## Do's and Don'ts

### Do:

- **Do** usar os tokens de `.page` (`var(--wine)`, `var(--line)`, `var(--radius-lg)`…) em qualquer página pública nova, montada dentro de `styles.page`.
- **Do** manter um único botão rose-fill preenchido por viewport; o resto é contorno ou link.
- **Do** escrever valores em reais em Manrope 800 com `font-variant-numeric: tabular-nums`.
- **Do** separar com hairline de 1px `line` sobre creme e creme translúcido (16–20%) sobre vinho.
- **Do** mostrar o produto com capturas reais em painel rose suave, com data e conta de testes declaradas.
- **Do** começar toda entrada de um quadro legível (opacidade 0,4, não 0) e entregar o estado final sem JavaScript e com movimento reduzido.
- **Do** garantir 16px de texto, 48px de alvo e foco de 3px (rose-fill sobre claro, lima sobre vinho).

### Don't:

- **Don't** criar paleta local nem cores fora dos tokens; o verde do WhatsApp flutuante não é precedente.
- **Don't** usar sombra para elevar painéis, nem gradiente ou vidro como identidade.
- **Don't** usar ExtraBold (800) em títulos ou texto corrido.
- **Don't** pôr texto lima sobre creme ou branco, nem lima em mais de um trecho de título por bloco.
- **Don't** usar o rose de assinatura (`rose`) como fundo de texto; para preencher, use `rose-fill`.
- **Don't** trocar a fonte, usar fonte de sistema em títulos ou escrever títulos em caixa alta espaçada.
- **Don't** fixar a tela (pin) para contar a jornada; a rolagem continua nativa.
