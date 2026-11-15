# landing

## Purpose

Site público do Lucro Caseiro. Apresenta a promessa “do custo à venda, sem chute e sem retrabalho”, demonstra o produto, oferece uma calculadora interativa com explicações de custo, preço e lucro, publica conteúdo educativo, mantém páginas legais/suporte e leva a pessoa para o app no navegador ou no Google Play.

## Non-goals

- Comportamento da Central de Marketing autenticada
- Checkout ou gestão de assinatura na web
- Busca de dados da API
- Personalização por usuário
- Substituição do catálogo público em `catalogo.lucrocaseiro.com.br`

## Boundaries & Ownership

- Dentro da fronteira: composição das rotas públicas, calculadora local, conteúdo educativo, páginas legais, SEO técnico, analytics opcional e chamadas para a loja
- Fora da fronteira: autenticação, dashboard de marketing, contratos de API, billing e catálogo público
- Depende de: Next.js App Router, `next/image`, `lucide-react`, `@lucro-caseiro/contracts` para cálculos puros, assets locais e diretrizes aprovadas
- Consumida por: pessoas avaliando o produto antes da instalação

## Code pointers

- `apps/web/src/app/landing/page.tsx` — rota e metadados públicos
- `apps/web/src/app/landing/layout.tsx` — tipografia e viewport isolados da Central de Marketing
- `apps/web/src/features/landing/landing-page.tsx` — conteúdo e composição da página
- `apps/web/src/features/landing/landing-page.module.css` — identidade visual e responsividade
- `apps/web/src/features/landing/price-calculator.tsx` — calculadora com campos agrupados, validação local, ficha de resultado e explicações da fórmula
- `apps/web/src/features/landing/public-page.tsx` — shell canônico das páginas públicas internas
- `apps/web/src/features/landing/site-chrome.tsx` — navegação e rodapé compartilhados
- `apps/web/src/app/sitemap.ts` e `robots.ts` — descoberta e isolamento das rotas públicas; o sitemap inclui os guias gerados
- `apps/web/src/app/landing/guias/[slug]/page.tsx` e `apps/web/src/features/landing/guide-articles.ts` — guias gerados: um JSON por guia em `apps/web/content/guias/<slug>.json`, enviado ao repositório pela Ametista (conexão GitHub). Arquivos inválidos são ignorados sem quebrar o build; endereços fora da pasta dão 404; guias escritos à mão mantêm rota própria e vencem um arquivo com o mesmo endereço
- `apps/web/public/landing/` — logo, ilustração e capturas reais do aplicativo
- `apps/web/PRODUCT.md` e `apps/web/.impeccable/` — verdade de produto e registro do processo de design (comp aprovado, spec medida, estado das fases, capturas de revisão)

## Components

- 2026-11-15 (2): Gratuito mais enxuto (ver `docs/planos-comerciais.md`). Cartão Gratuito lista cálculo de preço, 15 produtos e 30 clientes, agenda com 5 encomendas por mês, financeiro da semana atual, catálogo com 5 produtos e lembretes; o Premium ganhou "Fiado com cobrança por link, agenda sem limite e financeiro completo" e os PDFs. FAQ "O que está incluído no Gratuito?" segue a nova matriz. A página de solução "controle-de-fiado" deixou de prometer fiado grátis: título "Controle de fiado no celular", benefício e FAQ falam do teste de 7 dias e do preço do Premium (vindo do contracts); o que já estava pendente continua visível para dar baixa.
- 2026-11-15: mudança de preço decidida pela dona do produto. Saem o Essencial (R$ 29,90/mês) e o Profissional (R$ 69,90/mês); entra um plano pago só, o **Premium**: R$ 49,90/mês ou R$ 449/ano (R$ 37,42/mês, economia de R$ 149,80 no ano), com tudo liberado. Gratuito sem mudança. Toda conta nova ganha 7 dias do Premium, sem cartão e sem cobrança automática. Na landing: seção de planos com dois cartões (Gratuito e Premium) numa grade de duas colunas de até 880 px, seletor aberto no Anual com o selo "Mais vantajoso" no lugar de "2 meses grátis", valor por mês em destaque e o valor cobrado logo abaixo, como no app; título da seção "Comece grátis. Libere tudo quando precisar."; FAQ com "Quanto custa o Premium?"; hero, nota dos planos, CTA final, páginas de solução, termos de uso, metadados e JSON-LD (ofertas Gratuito, Premium mensal e Premium anual) falam em Premium. O botão do cartão pago passou a medir `plan_premium` (antes `plan_essencial`/`plan_profissional`). Exemplo de oferta da Central de Marketing usa o preço do contracts.

- 2026-11-14: nova composição "Página de decisão" escolhida pela dona do produto (mesma marca; objetivo: converter mais e parecer mais profissional). Ordem: hero, problema, três passos, vídeo, planos, índice, dúvidas, CTA final. A página caiu de ~9.560 px para ~7.180 px no desktop (1440) e de ~15.150 px para ~12.980 px no celular (390). Mudanças: (1) hero com entrada curta (800 ms) que parte de um estado já legível, sem esconder título ou botão; nota de gratuidade ao lado do botão e os dois links discretos na linha de baixo; as três capacidades viraram a base da faixa vinho (`ul.benefitStrip` dentro do hero). (2) Jornada deixou o palco fixo de 240svh: agora são três passos lado a lado (`ol.journeySteps`), cada um com número, rótulo, título, texto e a captura real recortada; uma linha rose liga os passos e se desenha com a rolagem (`--journey-progress`), as capturas sobem 40 px dentro do painel e os números 2 e 3 acendem ao serem alcançados. Abaixo de 900 px a linha some e cada passo vira linha texto + captura; abaixo de 560 px empilha. (3) Planos subiram para logo depois do vídeo. (4) Recursos, públicos e guias viraram um índice compacto de três colunas (`#recursos`, `.indexSection`): "No app", "Para quem" e "Guias"; a captura do financeiro e os ícones dos recursos saíram da página. Âncoras `#como-funciona`, `#produto`, `#recursos`, `#planos`, `#duvidas`, `#marmitas`, `#revenda-comercio`, `#artesanato-costura` e `#beleza-servicos` e todos os `data-analytics` preservados; nenhum texto de alegação novo (só os rótulos de coluna "No app", "Para quem" e "Guias"). Contrato de direção em `apps/web/.impeccable/surfaces/`. Ajustes da revisão de acabamento: no celular (≤560 px) o resultado da conta (preço sugerido e sobra) sobe para logo abaixo do produto, por `order`, e os dois links discretos vão para depois da ficha, para preço e sobra caberem na primeira tela de 390×844; o card dos planos ocupa toda a largura no tablet; "2 meses grátis" com 16 px e links do rodapé com 48 px; `--mint-text` escurecido para #2a7050 (AA sobre o fundo menta). O card do Essencial abre com "Tudo do Gratuito", espelhando o "Tudo do Essencial" do Profissional. `AppDemo`: controles nativos do vídeo só depois do primeiro play (antes, "Assistir · 1 min" é o único botão; um clique libera os controles mesmo se o navegador recusar o play), "Ler a demonstração" com a mesma seta desenhada do FAQ e o botão de play sem sombra.

- 2026-10-07: redesenho de ritmo pedido pelo dono do produto. Demo em vídeo saiu do bloco solto com vazio lateral e virou painel com capítulos após a jornada; rótulo acima do título da jornada removido (nota de procedência foi para baixo do texto); recursos viraram lista com ícone + captura do financeiro em vez de três cards iguais; públicos passaram a seis itens (inclui Marmitas e salgados e Outros negócios), com links para as páginas de confeitaria, marmita e manicure; espaço entre problema e jornada reduzido. Âncoras `#como-funciona`, `#produto`, `#recursos`, `#revenda-comercio`, `#artesanato-costura` e `#beleza-servicos` preservadas.

- 2026-10-01: rodapé "Para quem" alinhado ao público amplo da landing: confeitaria/doces, marmitas, revenda/comércio, artesanato/costura e beleza/serviços. Links amplos usam âncoras reais da seção existente, acessíveis também das páginas internas; páginas de confeitaria, marmitas e manicure permanecem disponíveis. Sem páginas novas ou alegações de funcionalidades adicionais.

- `AppDemo` - vídeo interno real de 64,4 segundos, build local mock com dados fictícios; cadastro, preço, venda e catálogo desativado. Fica depois da jornada (`#produto`), em painel branco com capítulos clicáveis ao lado do aparelho: os cinco capítulos espelham as legendas de `app-demo.pt-BR.vtt`, pulam o vídeo para o trecho e destacam a etapa atual (`aria-current=step`, eventos `demo_chapter` e `demo_play`). Controles nativos, sem áudio/autoplay/loop, preload none, poster local, legendas padrão e transcrição em details. Download permanece disponível. No celular a ordem é título, vídeo, capítulos e nota. Não consulta API nem cria conta. Não demonstra backend real, lucro realizado ou catálogo público ativo.

- `LandingPage` — cabeçalho em fluxo sobre faixa vinho, hero com conta ilustrativa (custos, subtotal, preço e sobra) e três capacidades na base da faixa, problema, três passos de preço → produto → catálogo com capturas reais, vídeo, planos, índice de recursos/públicos/guias, FAQ, CTA final e rodapé
- `SiteHeader` — aceita `tone="wine"` (barra em fluxo dentro da faixa vinho, usada só na landing) ou `paper` (barra flutuante das páginas internas); navegação compacta em `details` nativo, sem JavaScript de cliente
- `PriceCalculator` — ficha de preço com quatro grupos de campos (produto, tempo, fixos, lucro/taxas), exemplo identificado e ação para limpar/restaurar. O resumo separa custo, taxas e sobra; estado inválido oculta o resultado. Links para o resultado no celular e FAQ com `details`. As antigas prévias simuladas foram substituídas pelo link aos recursos reais da landing.
- `PublicPage` — estrutura reutilizada por guias, suporte, privacidade, termos e exclusão
- `GuidePage` — guia com breadcrumb, schema Article/BreadcrumbList, guias relacionados e CTA da calculadora; aceita `publishedAt` e schema extra (FAQPage) para os guias gerados
- Capturas do produto — usam os PNGs `current-*.png`, capturados no emulador Android com o código atual em 2026-09-04. Produtos, catálogo, precificação e financeiro; procedência e valores em `apps/web/public/landing/CAPTURES.md`. Imagens anteriores preservadas, mas fora da landing principal.
- Cards de planos (`pricing-plans.tsx`) — desde 2026-11-15, dois cartões: Gratuito e Premium (destacado, selo de dias grátis). Seletor Mensal/Anual abre no Anual, com o selo "Mais vantajoso". No anual o destaque é o valor por mês (R$ 37,42) e a linha de baixo diz o que é cobrado ("R$ 449,00 cobrados uma vez por ano. Economia de R$ 149,80 no ano."); no mensal, R$ 49,90 por mês e o lembrete do valor por mês no anual. Contas puras em `plan-price.ts` (fora do módulo "use client" para o FAQ de servidor poder usar). Preço e nome vêm de `PLAN_PRICING[SOLD_PLAN]` e `PLAN_LABELS[SOLD_PLAN]`

## Hooks & State

A calculadora usa apenas estado local (`useState`) para editar valores, recalcular e restaurar/limpar o exemplo; os valores não são persistidos nem enviados. Quando configurado, o Analytics mede edição e resultado válido sem os valores. Usa `useId` para ligar labels, ajuda e erros aos campos. As demais páginas são estáticas e renderizadas no servidor. O FAQ usa `details` nativo. Analytics é carregado apenas quando `NEXT_PUBLIC_GA_ID` estiver configurado.

```yaml
feature: landing
app: web
api_counterpart: none
hooks:
  - useState e useId (calculadora)
api_endpoints: []
```

## API Integration

Nenhuma.

## Contracts (Zod/DTO)

Os cálculos importam as funções puras de `@lucro-caseiro/contracts`. Textos de preço devem continuar alinhados com `PLAN_PRICING` e `docs/planos-comerciais.md` quando a oferta mudar.

## Error Handling

Não há carregamento de dados. Links externos apontam para Google Play, política de privacidade e e-mail de suporte canônicos.

## Performance

- JavaScript de cliente restrito à calculadora, `LandingMotion`, `PointerFeedback` e analytics opcional; GSAP/ScrollTrigger usado na jornada do produto
- Assets locais servidos pelo Next Image
- Movimento em CSS, Web Animations API e GSAP/ScrollTrigger; `IntersectionObserver` dispara entradas uma vez. Conteúdo visível sem JavaScript; redução de movimento, foco e teclado interrompem as entradas.
- Efeitos externos adaptados localmente: onda de clique do Magic UI (MIT) nos CTAs e botão de exemplo; sublinhado de navegação inspirado em Tobias Ahlin. Fontes, adaptações e licença em `EFFECTS-SOURCES.md`. O único script externo da landing é o Google Analytics quando um ID real está configurado.
- Sem imagens remotas

## Test matrix

- Renderização e build da rota sem erro
- Guias gerados: validação (endereço igual ao arquivo, data AAAA-MM-DD, ao menos duas seções), ordem do mais novo ao mais antigo e precedência dos guias escritos à mão (`guide-articles.test.ts`)
- CTAs apontam para o package Android canônico
- Visual responsivo em desktop, tablet e celular
- FAQ navegável por teclado com elemento semântico nativo
- Metadados permitem indexação nas nove páginas públicas
- Calculadora usa a mesma fórmula testada pelo mobile e pela API
- Calculadora mantém o resultado do exemplo: custo R$ 49,50, preço R$ 74,25 e lucro R$ 24,75; com taxa de 10%, preço R$ 82,50 e taxa R$ 8,25
- Campos inválidos e produção zero com custos fixos não apresentam preço; limpar/restaurar exemplo funciona
- FAQ e atalhos ao resultado funcionam pelo teclado
- Sitemap contém somente rotas públicas e robots bloqueia a Central de Marketing

## AI Guidance

- Manter a landing estática até existir requisito explícito para dados dinâmicos.
- Não acoplar a página à autenticação da Central de Marketing.
- Usar somente benefícios implementados e preços confirmados.
- Diferenciar visualmente recurso do Gratuito de recurso do Premium. Desde 2026-11-15 o único plano pago se chama “Premium”; não citar mais “Essencial” nem “Profissional” em textos públicos. Selo do anual é “Mais vantajoso”, nunca “Mais vendido” (sem dado de vendas).
- Reaproveitar capturas reais e assets canônicos antes de criar imagens paralelas.
- Preservar o fluxo narrativo: precificação → produto → catálogo ou venda.
- A landing segue a identidade do app, sem mundo visual próprio (`apps/web/PRODUCT.md`, `docs/designs/design-system/DESIGN.md`, ADR-0008): Manrope única; vinho `#4A2332` para marca e títulos; rose `#B65F72` só em botões e texto grande (em texto corrido sobre creme usar `--rose-fill #A85A67`, que fecha AA); lima `#DCE86A` só no pingo do logo, no destaque do hero/CTA final e no rótulo do hero; superfícies opacas, hairline, raios largos, sem gradiente, glass ou sombra pesada.
- Nenhum texto abaixo de 16px e nenhuma alegação de popularidade ou uso ("mais escolhido", números de clientes) sem fonte em `docs/marketing/provas-e-alegacoes.md`.
- Movimento: após considerar as versões anteriores básicas e rápidas, a dona do produto pediu referências de React Bits, 21st, Universe, GSAP, Unlumen, GetLayers e MotionSites. Desde 2026-11-14 a jornada não tem palco fixo: a linha entre os três passos e a subida das capturas são guiadas pela rolagem (GSAP ScrollTrigger, scrub 0.8, sem pin). Título do hero com 800ms a partir de opacidade 0.4, traço com 900ms; entradas secundárias de rolagem continuam com 1400ms. Teclado/redução de movimento desfazem a cena e mostram o estado final. Fontes em `EFFECTS-SOURCES.md`.

## Change log / Decisions

- 2026-09-04: adicionado “Usar no navegador” no hero, navegação desktop/mobile e CTA final. `PWA_URL` aponta para `https://app.lucrocaseiro.com.br`, endereço canônico já usado no app mobile e verificado abrindo a tela pública de login/criação de conta. Eventos `pwa_hero`, `pwa_header`, `pwa_mobile_menu` e `pwa_final`; mantidos os acessos ao Google Play e à calculadora sem conta. O PWA do cliente é separado da Central de Marketing.

- 2026-09-04: a pedido da dona do produto, as capturas antigas foram substituídas por prints atuais do emulador `lucro_e2e`, usando a conta de testes já conectada. A simulação não foi salva e nenhum dado da conta foi alterado. O exemplo do hero foi alinhado ao resultado realmente mostrado pelo app (custo R$ 23,10, acréscimo 32%, preço R$ 30,49, sobra R$ 7,39). Precificação completa identificada como Profissional conforme a tela atual. Telas mantêm proporção nativa, com enquadramento responsivo e indicação de dados de teste.
- 2026-09-04: refinamento com frontend-design mantendo a identidade aprovada. Conta do hero explicita custo total e separa preço de sobra; textos incluem produção, vendas e serviços; telas do app lado a lado substituem sobreposição; planos com alinhamento consistente e escolha explicitamente dentro do app. Navegação móvel nativa, contraste dos CTAs, foco, fontes mínimas e redução de movimento revisados. Typecheck, lint e build de produção aprovados; revisão visual e ausência de overflow verificadas em 320, 390, 768 e 1440 px.
- 2026-07-16: criada a landing pública como vertical slice isolado em `/landing`, seguindo a arquitetura do Lunoa sem alterar a raiz autenticada da Central de Marketing.
- 2026-07-16: site expandido com calculadora pública, suporte, privacidade, termos, exclusão de conta, três guias de precificação, sitemap, robots, dados estruturados e analytics opcional. A Central continua fora do índice e a calculadora não envia nem salva valores.
- 2026-07-16: calculadora ganhou uma segunda aba com simulações interativas de mensagens para WhatsApp, orçamento PDF, catálogo personalizado e relatórios avançados. Mensagens gerais aparecem como recurso do app; aniversário e as três prévias avançadas são identificados como Profissional.
- 2026-09-02: a dona do produto rejeitou as direções com mundo visual próprio ("não está seguindo a brand do app") e escolheu o comp "Vinho Editorial" (`apps/web/.impeccable/mocks/decision-brand/brand-vinho.png`). Landing reconstruída com o processo comp-led do impeccable (spec → hero → sections → motion → responsive → review): cabeçalho e hero em faixa vinho, card creme com a conta de um brigadeiro de exemplo, Manrope carregada só em `app/landing/layout.tsx` (a Central segue com a fonte do RootLayout). IA, preços e CTAs canônicos mantidos; rótulos de seção removidos (só o do hero, que está no comp); "Mais escolhido" virou "Recomendado". Revisor de acabamento fechou em `fix` com dois pontos em aberto registrados no estado: rótulo do hero (banido pelo craft floor, mantido por estar no comp aprovado) e fechamentos forçados dos gates por diferença de fonte.

### 2026-09-04 — Reformulação da calculadora pública

Rota `/landing/calculadora` ganhou composição própria com o cabeçalho/rodapé compartilhados e tokens da marca. Textos explicam lucro sobre o custo (a fórmula já existente), trabalho remunerado, rateio mensal e taxas sobre o preço final. Fórmulas do contracts preservadas. Novo evento `calculator_view_features` para o link à landing substitui o antigo `play_store_feature_demo`, pois o destino deixou de ser a loja. CTA da calculadora conserva `play_store_calculator_result`.

### 2026-09-04 — Jornada do produto controlada pela rolagem

`product-journey-motion.ts` registra GSAP ScrollTrigger e usa matchMedia para montar/desmontar o palco. Animações têm escopo local e limpeza de estilos/eventos; rolagem nativa, sem snap ou captura de wheel. A antiga dupla de screenshots foi substituída por precificação, produtos e catálogo, mantendo as capturas atuais. Somente a rota landing carrega GSAP.

## Atualização de conteúdo e descoberta — 2026-09-10

- URL principal canônica `/`; `/landing` e o host `www` redirecionam permanentemente em hosts públicos. A raiz da Central continua privada. Parâmetros são preservados no redirecionamento/rewrite.
- Robots libera raiz exata, páginas públicas e assets de renderização; sitemap usa datas editoriais por página.
- `public-metadata.ts` compartilha OG/Twitter com imagem própria em `landing/opengraph-image.tsx`.
- Planos importam preços e limites do contracts. Catálogo personalizado no plano pago (hoje o Premium); mão de obra, rateio por produção e taxas manuais em todos os planos.
- Guias revisados com exemplos fechados, diferença entre markup e margem, fontes e links relacionados.
- `analytics-events.ts` diferencia exemplo inicial de resultado editado válido. Eventos sem valores financeiros; ID GA precisa ser configurado no build e validado na propriedade.

## Revisão local da landing — 2026-09-30

Promessa oferece preço ou venda como primeiro valor, com produção, revenda e serviços. CTAs sem rótulo explícito dizem o destino (navegador ou Google Play); sem JavaScript o destino inicial é o navegador, disponível em qualquer aparelho. IDs de analytics, atribuição e rotas são preservados. A calculadora explica antes dos links que não transfere valores para o app; aria-describedby liga ambos à explicação. Não há importação, mudança de autenticação, preço, API ou coleta adicional. Instagram oficial atualizado para @lucrocaseiroapp conforme confirmação da dona do produto. A jornada usa capturas reais de 04/09/2026 da conta de testes, identificadas como históricas, sem prometer a UI atual. Walkthrough em revisão fica fora da LP até aprovação visual; não representa execução atual de QA.

## Calculadora pública — 2026-09-30

Input textual com teclado decimal preserva vírgula/ponto e não descarta caracteres silenciosamente; valores ambíguos são inválidos. Modo lote divide materiais, embalagem e trabalho pela quantidade inteira positiva, mantendo rateio mensal por unidades do mês. Revenda usa preço de compra por item; serviço usa material e tempo por atendimento. Valor da hora vazio com tempo positivo produz resultado parcial identificado; zero deliberado avisa que o tempo não está remunerado. Nenhum valor vai para analytics ou API. Fórmulas compartilhadas e gross-up de taxas preservados.

### Evidência de revisão — 30/09/2026

14 testes unitários de landing aprovados; typecheck e lint direcionado sem erros após correção de tipos. Chromium local isolado (pt-BR, tráfego externo interceptado): 39 verificações de calculadora/responsividade e 14 cliques de CTA em desktop e Android por user-agent; isso não é Android real. Vírgula digitada sequencialmente, ponto, colagem de 1.234,56, saída do campo, erros/recuperação, hora ausente/zero, herança do exemplo e casos lote/revenda/serviço conferidos. Arquivos de evidência estão no workspace task-4 (browser-results.json, cta-click-results.json e capturas PNG). O cabeçalho móvel não cobre mais o início do resultado no atalho, por scroll-margin-top. Sem deploy, push ou novas contas. Vídeo permanece pendente, conforme prioridade da calculadora.
