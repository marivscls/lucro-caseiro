# landing

## Purpose

Site público do Lucro Caseiro. Apresenta a promessa “do custo à venda, sem chute e sem retrabalho”, demonstra o produto, oferece uma calculadora interativa com explicações de custo, preço e lucro, publica conteúdo educativo, mantém páginas legais/suporte e leva a pessoa para o Google Play.

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
- `apps/web/src/app/sitemap.ts` e `robots.ts` — descoberta e isolamento das rotas públicas
- `apps/web/public/landing/` — logo, ilustração e capturas reais do aplicativo
- `apps/web/PRODUCT.md` e `apps/web/.impeccable/` — verdade de produto e registro do processo de design (comp aprovado, spec medida, estado das fases, capturas de revisão)

## Components

- `LandingPage` — cabeçalho em fluxo sobre faixa vinho, hero com conta ilustrativa (custos, subtotal, preço e sobra), faixa de benefícios, problema, fluxo em quatro passos, duas telas do app lado a lado, recursos, públicos, planos, guias, FAQ, CTA final e rodapé
- `SiteHeader` — aceita `tone="wine"` (barra em fluxo dentro da faixa vinho, usada só na landing) ou `paper` (barra flutuante das páginas internas); navegação compacta em `details` nativo, sem JavaScript de cliente
- `PriceCalculator` — ficha de preço com quatro grupos de campos (produto, tempo, fixos, lucro/taxas), exemplo identificado e ação para limpar/restaurar. O resumo separa custo, taxas e sobra; estado inválido oculta o resultado. Links para o resultado no celular e FAQ com `details`. As antigas prévias simuladas foram substituídas pelo link aos recursos reais da landing.
- `PublicPage` — estrutura reutilizada por guias, suporte, privacidade, termos e exclusão
- Capturas do produto — usam os PNGs `current-*.png`, capturados no emulador Android com o código atual em 2026-09-04. Produtos, catálogo, precificação e financeiro; procedência e valores em `apps/web/public/landing/CAPTURES.md`. Imagens anteriores preservadas, mas fora da landing principal.
- Cards de planos — refletem Gratuito, Essencial e Profissional conforme a matriz comercial vigente

## Hooks & State

A calculadora usa apenas estado local (`useState`) para editar valores, recalcular e restaurar/limpar o exemplo; nada é persistido ou enviado. Usa `useId` para ligar labels, ajuda e erros aos campos. As demais páginas são estáticas e renderizadas no servidor. O FAQ usa `details` nativo. Analytics é carregado apenas quando `NEXT_PUBLIC_GA_ID` estiver configurado.

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
- Efeitos externos adaptados localmente: onda de clique do Magic UI (MIT) nos CTAs e botão de exemplo; sublinhado de navegação inspirado em Tobias Ahlin. Fontes, adaptações e licença em `EFFECTS-SOURCES.md`. Não há carregamento de scripts externos.
- Sem imagens remotas

## Test matrix

- Renderização e build da rota sem erro
- CTAs apontam para o package Android canônico
- Visual responsivo em desktop, tablet e celular
- FAQ navegável por teclado com elemento semântico nativo
- Metadados permitem indexação apenas nesta rota pública
- Calculadora usa a mesma fórmula testada pelo mobile e pela API
- Calculadora mantém o resultado do exemplo: custo R$ 49,50, preço R$ 74,25 e lucro R$ 24,75; com taxa de 10%, preço R$ 82,50 e taxa R$ 8,25
- Campos inválidos e produção zero com custos fixos não apresentam preço; limpar/restaurar exemplo funciona
- FAQ e atalhos ao resultado funcionam pelo teclado
- Sitemap contém somente rotas públicas e robots bloqueia a Central de Marketing

## AI Guidance

- Manter a landing estática até existir requisito explícito para dados dinâmicos.
- Não acoplar a página à autenticação da Central de Marketing.
- Usar somente benefícios implementados e preços confirmados.
- Diferenciar visualmente recurso geral de recurso exclusivo do Profissional; nunca chamar o tier comercial de “Premium”.
- Reaproveitar capturas reais e assets canônicos antes de criar imagens paralelas.
- Preservar o fluxo narrativo: precificação → produto → catálogo ou venda.
- A landing segue a identidade do app, sem mundo visual próprio (`apps/web/PRODUCT.md`, `docs/designs/design-system/DESIGN.md`, ADR-0008): Manrope única; vinho `#4A2332` para marca e títulos; rose `#B65F72` só em botões e texto grande (em texto corrido sobre creme usar `--rose-fill #A85A67`, que fecha AA); lima `#DCE86A` só no pingo do logo, no destaque do hero/CTA final e no rótulo do hero; superfícies opacas, hairline, raios largos, sem gradiente, glass ou sombra pesada.
- Nenhum texto abaixo de 16px e nenhuma alegação de popularidade ou uso ("mais escolhido", números de clientes) sem fonte em `docs/marketing/provas-e-alegacoes.md`.
- Movimento: após considerar as versões anteriores básicas e rápidas, a dona do produto pediu referências de React Bits, 21st, Universe, GSAP, Unlumen, GetLayers e MotionSites. A jornada atual ocupa 340svh, com palco sticky e 3 capturas reais em pilha, animadas pela rolagem (GSAP ScrollTrigger, scrub 1.6), com pausas de leitura. Título em linhas com 1600ms, traço com 1800ms; entradas secundárias com 1400ms. Teclado/redução de movimento desfazem a cena para leitura linear; telas abaixo de 700px de altura usam o layout linear. Fontes em `EFFECTS-SOURCES.md`.

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
