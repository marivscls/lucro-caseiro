# landing

## Purpose

Site público do Lucro Caseiro. Apresenta a promessa “do custo à venda, sem chute e sem retrabalho”, demonstra o produto, oferece uma experiência interativa com calculadora e prévias de recursos, publica conteúdo educativo, mantém páginas legais/suporte e leva a pessoa para o Google Play.

## Non-goals

- Comportamento da Central de Marketing autenticada
- Checkout ou gestão de assinatura na web
- Busca de dados da API
- Personalização por usuário
- Substituição do catálogo público em `catalogo.lucrocaseiro.com.br`

## Boundaries & Ownership

- Dentro da fronteira: composição das rotas públicas, calculadora local, simuladores demonstrativos de recursos, conteúdo educativo, páginas legais, SEO técnico, analytics opcional e chamadas para a loja
- Fora da fronteira: autenticação, dashboard de marketing, contratos de API, billing e catálogo público
- Depende de: Next.js App Router, `next/image`, `lucide-react`, `@lucro-caseiro/contracts` para cálculos puros, assets locais e diretrizes aprovadas
- Consumida por: pessoas avaliando o produto antes da instalação

## Code pointers

- `apps/web/src/app/landing/page.tsx` — rota e metadados públicos
- `apps/web/src/app/landing/layout.tsx` — tipografia e viewport isolados da Central de Marketing
- `apps/web/src/features/landing/landing-page.tsx` — conteúdo e composição da página
- `apps/web/src/features/landing/landing-page.module.css` — identidade visual e responsividade
- `apps/web/src/features/landing/price-calculator.tsx` — experiência interativa com calculadora e prévias de WhatsApp, orçamento, catálogo e relatórios
- `apps/web/src/features/landing/public-page.tsx` — shell canônico das páginas públicas internas
- `apps/web/src/features/landing/site-chrome.tsx` — navegação e rodapé compartilhados
- `apps/web/src/app/sitemap.ts` e `robots.ts` — descoberta e isolamento das rotas públicas
- `apps/web/public/landing/` — logo, ilustração e capturas reais do aplicativo

## Components

- `LandingPage` — navegação, hero, demonstração do fluxo, recursos, planos, FAQ, CTA final e rodapé
- `PriceCalculator` — alterna entre simulação de preço e prévias dos recursos do app; WhatsApp gera mensagens editáveis, enquanto orçamento PDF, catálogo personalizado e relatórios representam capacidades do Profissional
- `PublicPage` — estrutura reutilizada por guias, suporte, privacidade, termos e exclusão
- Capturas do produto — usam telas reais de precificação, início e catálogo
- Cards de planos — refletem Gratuito, Essencial e Profissional conforme a matriz comercial vigente

## Hooks & State

A experiência de demonstração usa apenas estado local (`useState`) para trocar abas, recalcular valores, editar mensagens e responder às ações simuladas; nada é persistido ou enviado. As demais páginas são estáticas e renderizadas no servidor. O FAQ usa `details` nativo. Analytics é carregado apenas quando `NEXT_PUBLIC_GA_ID` estiver configurado.

```yaml
feature: landing
app: web
api_counterpart: none
hooks:
  - useState (calculadora e simuladores de recursos)
api_endpoints: []
```

## API Integration

Nenhuma.

## Contracts (Zod/DTO)

Os cálculos importam as funções puras de `@lucro-caseiro/contracts`. Textos de preço devem continuar alinhados com `PLAN_PRICING` e `docs/planos-comerciais.md` quando a oferta mudar.

## Error Handling

Não há carregamento de dados. Links externos apontam para Google Play, política de privacidade e e-mail de suporte canônicos.

## Performance

- JavaScript de cliente restrito à experiência interativa e analytics opcional; sem biblioteca de animação
- Assets locais servidos pelo Next Image
- Movimento apenas em CSS e desativado com `prefers-reduced-motion`
- Sem imagens remotas

## Test matrix

- Renderização e build da rota sem erro
- CTAs apontam para o package Android canônico
- Visual responsivo em desktop, tablet e celular
- FAQ navegável por teclado com elemento semântico nativo
- Metadados permitem indexação apenas nesta rota pública
- Calculadora usa a mesma fórmula testada pelo mobile e pela API
- Abas de recursos respondem por mouse e teclado; mensagens de WhatsApp refletem os campos editados
- Recursos exclusivos exibem “Profissional”; mensagens gerais não são apresentadas como exclusivas do plano
- Sitemap contém somente rotas públicas e robots bloqueia a Central de Marketing

## AI Guidance

- Manter a landing estática até existir requisito explícito para dados dinâmicos.
- Não acoplar a página à autenticação da Central de Marketing.
- Usar somente benefícios implementados e preços confirmados.
- Diferenciar visualmente recurso geral de recurso exclusivo do Profissional; nunca chamar o tier comercial de “Premium”.
- Reaproveitar capturas reais e assets canônicos antes de criar imagens paralelas.
- Preservar o fluxo narrativo: precificação → produto → catálogo ou venda.

## Change log / Decisions

- 2026-07-16: criada a landing pública como vertical slice isolado em `/landing`, seguindo a arquitetura do Lunoa sem alterar a raiz autenticada da Central de Marketing.
- 2026-07-16: site expandido com calculadora pública, suporte, privacidade, termos, exclusão de conta, três guias de precificação, sitemap, robots, dados estruturados e analytics opcional. A Central continua fora do índice e a calculadora não envia nem salva valores.
- 2026-07-16: calculadora ganhou uma segunda aba com simulações interativas de mensagens para WhatsApp, orçamento PDF, catálogo personalizado e relatórios avançados. Mensagens gerais aparecem como recurso do app; aniversário e as três prévias avançadas são identificados como Profissional.
