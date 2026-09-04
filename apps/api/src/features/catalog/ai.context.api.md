# ai.context.api.md — Catalog (Catálogo Público)

---

## Purpose

Catálogo público compartilhável: uma página web (HTML servida pela própria API, sem
infra extra) com os produtos ativos do usuário e botão de pedido via WhatsApp. Na
marca Papelaria, também oferece carrinho com reserva de estoque. O usuário
ativa/desativa, escolhe o endereço (`slug`) e o WhatsApp de pedidos no app.

## Non-goals

- Não processa pagamento online; na Papelaria o pedido vira reserva para recebimento no PDV.
- Não gerencia produtos (feature `products`); apenas lê produtos ativos.
- Não revela quantidade exata de estoque; informa apenas se uma variação está disponível.
- Não tem SEO avançado/domínio próprio (futuro premium).
- Não processa remoção de fundo; `hero.removeBackground` só escolhe `processedUrl`/recorte vs foto original.

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CatalogSettings, UpdateCatalogSettings,
  PublicCatalog), `@lucro-caseiro/database/schema` (catalogSettings, products, users).
- **Composição**: nenhuma injeção cross-feature; repo próprio lê `products`/`users`.
- **Dependentes**: mobile feature `catalog` e API feature `retail` para reservas da Papelaria.

## Code pointers

- `catalog.routes.ts` — `createCatalogRouter` (autenticado) e `createPublicCatalogRouter` (público)
- `catalog.usecases.ts` — settings (defaults lazy, validação de slug), catálogo público
- `catalog.domain.ts` — `slugify`, `isValidSlug`, `renderCatalogHtml` (delega ao renderer)
- `storefront-renderer.ts` — HTML da vitrine pública (layout atual)
- `storefront-styles.ts` — CSS da vitrine pública
- `catalog.repo.pg.ts` — persistência de settings + leitura de produtos ativos
- `catalog.types.ts` — `ICatalogRepo`, `CatalogOwner`

## Data Model

- `catalog_settings` (migration 011): `user_id` PK → users (cascade), `slug` UNIQUE,
  `enabled` (default false), `whatsapp` (nullable; fallback `users.phone`), `updated_at`.
- `brand_id` (migration 040) identifica qual marca assina o catálogo e qual app recebe o link da loja.
- Índice `idx_catalog_settings_slug` para lookup público por slug.
- Lê `products` (`userId`, `isActive = true`) e `users` (businessName, name, phone).

## Invariants

- Slug: `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$` (1–40 chars, sem hífen nas pontas), único global.
- Catálogo público só responde se `enabled = true`; senão 404 (não vaza existência).
- Apenas produtos `isActive = true` aparecem; sempre escopados por `userId` do dono do slug.
- Defaults criados lazy no primeiro GET de settings: `enabled = false`, slug derivado do
  nome do negócio (sufixo `-N` em conflito), whatsapp = `users.phone`.
- HTML escapa qualquer conteúdo do usuário (XSS).

## Operations

```yaml
feature: catalog
app: api
mobile_counterpart: catalog
api:
  base: /api/v1/catalog
  endpoints:
    - method: GET
      path: /settings
      response: CatalogSettings # cria defaults na 1a chamada
    - method: PUT
      path: /settings
      body: UpdateCatalogSettings
      response: CatalogSettings
    - method: GET
      path: /c/:slug # público, montado na raiz; HTML
      response: text/html
    - method: GET
      path: /c/:slug/json # público; JSON PublicCatalog
      response: PublicCatalog
db:
  tables: [catalog_settings, products, users]
  indexes: [idx_catalog_settings_slug]
invariants:
  - slug unico global, formato kebab 1-40 chars
  - pagina publica 404 se enabled=false
  - somente produtos ativos do dono do slug
```

## Authorization & RLS

- `/api/v1/catalog/settings`: `authMiddleware` + `getUserId(req)`.
- `/c/:slug`: público por design (sem auth). `?produto=<id>#produto-<id>` abre diretamente o card do produto e garante sua presenca entre os 3 itens de planos limitados. Exposição limitada a businessName,
  whatsapp escolhido e produtos ativos (nome, descrição, foto, preço).

## Contracts (Zod/DTO)

- `CatalogSettingsDto` — inclui `brandId`, slug, estado e personalização.
- `UpdateCatalogSettingsDto` — inclui os campos compartilhados e, para a vitrine de serviços, `serviceCoverUrl?`, `serviceTagline?` (máx 120) e `servicePromoBanner?` (máx 60). Campos de personalização exigem Essencial; slug é validado por regex.
- `PublicCatalogDto` — inclui `brandId`; produtos expõem variações com `inStock`, sem quantidade/custo.

## Errors

- 400 `ValidationError` — slug inválido ou já em uso ("Este endereço já está em uso...").
- 404 `NotFoundError` — slug inexistente ou catálogo desativado.

## Events / Side effects

- Nenhum.

## Performance

- Lookup público: 1 query por slug (índice) + 1 query de produtos. Sem cache (MVP).

## Security

- XSS: `renderCatalogHtml` escapa nome/descrição/foto via `escapeHtml`.
- Enumeração: 404 idêntico para "não existe" e "desativado".
- Dados expostos são apenas os necessários para vender (sem custos, estoque, clientes).

## Test matrix

- Domínio: slugify (acentos, especiais, fallback, tamanho), isValidSlug, HTML
  (preço, /kg, escape, sem-whatsapp, vazio).
- Usecases: defaults lazy, conflito de slug (sufixo), validação/conflito no update,
  preservação de campos não enviados, 404 público (inexistente/desativado), fallback
  de whatsapp para `users.phone`.

## Examples

- `GET /c/doces-da-maria?produto=<uuid>#produto-<uuid>` → página HTML posicionada no produto, com botões `wa.me`.
- `PUT /api/v1/catalog/settings` `{ "enabled": true, "slug": "doces-da-maria" }`.

## Change log / Decisions

- 2026-08-31: na vitrine pública (Ver como cliente) os destaques ficam
  mais largos no celular e o nome quebra em 2 linhas. Sem foto, o
  placeholder deixa de ser um quadrado 1:1 enorme.

- 2026-08-29: data e horário do diálogo de agendamento empilham no
  celular. O `input type=date` do iOS ignora o `gap` da grade e cobre
  o horário; no telefone cada campo fica numa linha, como nome e
  WhatsApp. Lado a lado só a partir de 768px.

- 2026-08-29: a grade “Escolha o que deseja” da vitrine pública empilha
  foto quadrada, nome em 2 linhas e preço. “a partir de” fica numa linha
  e o valor em `nowrap`, para não cortar “Bolo personalizado” nem
  “R$ 240,00”.

- 2026-08-29: `/c/:slug` usa só o layout atual (`storefront-renderer`). Sem
  JSON publicado, o HTML monta um tema padrão (capa, logo, nome, WhatsApp)
  e não volta ao template legado. O rascunho do editor não aparece na
  página pública até “Salvar e publicar”.

- 2026-08-29: as abas Produtos/Serviços da vitrine pública ficam no
  mesmo tamanho compacto das pílulas de categoria (32px, canto redondo).

- 2026-08-29: a vitrine pública passou a um layout denso de catálogo:
  faixa de aviso, capa curta (180–210px) com card da loja sobreposto,
  busca real, chips de categoria, abas Produtos/Serviços com contagem,
  trilho de Destaques (itens configurados ou os primeiros da lista) e
  grade compacta. Cabeçalho sticky (logo, nome, busca e WhatsApp) aparece
  quando o card da loja sai da tela (`IntersectionObserver`). O campo
  vazio vinha do `input type=hidden` com `showSearch: false`; a busca
  agora é sempre visível na página pública. O nome não usa mais
  `max-width: 11ch` (quebrava palavras longas). FAB compacto “Contato”
  some no topo e volta na rolagem.

- 2026-08-29: título e frase da vitrine usam `identity.primaryColor` e
  `identity.textColor`. O CSS do hero (h1, `.introduction`, `.signature`)
  lê esses tokens; o fundo continua no creme da marca.

- 2026-08-29: as abas Produtos/Serviços filtram de verdade: o HTML já
  nasce com o outro tipo `hidden`/`is-hidden`, o grid e o shell usam
  `data-kind-filter`, e o CSS `display:none !important` vem depois do
  `display:flex` dos cards. Clicar Serviços some os produtos (e o
  contrário). A prévia local do rascunho também troca a lista ao clicar.

- 2026-08-29: a aba Serviços some os produtos de verdade. `[hidden]`
  ganha `display:none !important` porque no Safari o `display:flex` dos
  cards (e o `display:grid` do X da busca) ignorava o atributo. O clique
  das abas/categorias ficou só nos controles, não nos cards.

- 2026-08-29: o zoom da capa (`hero.coverFocal.scale`) usa o mesmo ponto
  de `object-position` como `transform-origin`, para o recorte acompanhar
  as setas do editor.

- 2026-08-29: o editor mobile deixa de gravar busca e filtros. Estilo do
  banner (clássico/editorial/compacto), assinatura e informações rápidas
  continuam sendo salvos; o próximo save aplica cards editoriais e WhatsApp.

- 2026-08-29: “Ver detalhes” abre um diálogo com nome, foto, preço e
  descrição (ou aviso se o item ainda não tem texto). O clique não depende
  mais de `showDetails` nem de descrição no card. Sem busca na vitrine, o
  script deixa de quebrar no botão de limpar.

- 2026-08-29: Clássico, Editorial e Compacto passam a ter CSS próprio na
  vitrine pública (altura, grade texto+destaques no editorial ≥480px, topo
  curto no compacto). A classe `hero-*` deixou de ser só marcação.

- 2026-08-29: cards da vitrine empilham status e CTA em coluna (botão 48px
  em largura total) para não cortar “Disponível”/“Presencial”. “a partir de”
  só entra com variação de produto ou preços distintos de serviço. Disponibilidade
  usa ícone de check; duração usa relógio e local usa pin. Sem foto, o
  serviço mostra um selo circular, sem oval decorativo. FAB de contato virou pílula com fonte
  16px e some quando cobre um CTA do card.

- 2026-08-19: o FAB de contato (`.floating-contact`) parte o rótulo em duas
  linhas (`splitFloatingContactLines`) e usa 76px com padding interno para
  “Entrar em contato” não encostar na borda.

- 2026-08-19: `hero.removeBackground` decide se o destaque usa recorte
  (`processedUrl` + classe `featured-cutout`) ou a foto original (`featured-photo`).

- 2026-08-19: nomes públicos passam por `displayCatalogName` no renderer
  para remover prefixos técnicos como `[massa]`. A capa continua
  vindo só de `coverUrl`/`serviceCoverUrl`; `hero.coverFocal` opcional ajusta
  `object-position` e zoom sem recriar a arte.

- 2026-08-19: ícones de WhatsApp da vitrine (CTA do hero, atalho "Contato pelo WhatsApp", FAB e botões de pedido) usam o glifo oficial (balão + telefone, `fill="currentColor"`) no `storefront-renderer`.

- 2026-08-18: a vitrine publicada (`storefront-renderer` + `storefront-styles`) usa a mesma tipografia do app (Manrope 400–800, ADR-0008). Capa só via `coverUrl`/`serviceCoverUrl` com `object-fit: cover` e gradiente creme localizado à esquerda. A faixa promocional e o atalho com ícone `sparkles` mostram só o texto, sem o brilho. Busca+filtro no mesmo campo, categorias com sublinhado, abas Produtos/Serviços e cards com rodapé separado. Sem blob, SVG ou fotografia fixa no hero.

- 2026-08-01: links `?tipo=produtos` e `?tipo=servicos` renderizam somente a seção escolhida. A vitrine de serviços ganhou capa, frase e faixa promocional próprias (`service_*`, migration 047); logo, WhatsApp, cor e pattern continuam compartilhados.

- 2026-07-28: o catálogo público passa a incluir serviços marcados como públicos,
  com duração, local, opções, adicionais e pacotes. `POST
/c/:slug/service-bookings` recebe solicitações de horário sem criar um
  agendamento automaticamente.

- 2026-07-31: cards públicos de serviço seguem a composição compacta já usada na
  tela de Serviços: marca circular com inicial, nome, descrição, duração/local,
  preço separado e CTA preenchido. Como serviços não possuem foto, não herdam o
  bloco visual de 220 px dos produtos. Catálogos somente de serviços também mantêm
  respiro entre o hero e a seção.
- 2026-07-29: serviços passaram a usar os mesmos tokens de card, chips, preço, CTA
  e grid dos produtos; a tagline do hero adapta ao conteúdo (só produtos, só
  serviços ou ambos).

- 2026-06-09: criação (MVP). HTML server-rendered pela própria API para não exigir
  novo deploy/web app; pedido via deep link `wa.me` com mensagem pré-preenchida.
- 2026-06-09: redesign premium da página: hero com gradiente e avatar, tipografia serif,
  cards com sombra, botão WhatsApp com ícone SVG inline, contador de produtos, og:tags
  para preview de link, mensagens `wa.me` com emojis e nome do produto em negrito.
- 2026-06-09: **personalização Premium** (migration 012): `cover_url`, `accent_color`
  (preset: brown/rose/green/lavender/blue/amber) e `tagline` (máx 120) em
  `catalog_settings`. Gate no backend: update desses campos exige plano premium
  (senão `LimitExceededError`/LIMIT_EXCEEDED → paywall no app); na página pública a
  personalização só é aplicada enquanto o dono for premium (assinatura caiu → tema padrão,
  dados preservados). Paletas em `CATALOG_ACCENT_PRESETS` (domínio).
- 2026-06-09: cor hexadecimal livre — `accentColor` aceita preset OU `#rrggbb`
  (`CATALOG_HEX_COLOR_REGEX`); `paletteFromHex` deriva gradiente/fundo do hex. Valor
  inválido salvo no banco cai no marrom padrão no render.
- 2026-06-09: foto de perfil/logo (`logo_url`, migration 013) — substitui a inicial no
  avatar do hero. Mesmo gate Premium dos demais campos de personalização.
- 2026-06-09: pattern decorativo no hero (`pattern`, migration 014; enum
  dots/bubbles/grid/stripes) — overlay CSS puro (`HERO_PATTERNS`); mesmo gate Premium.
- 2026-06-09: capa integrada ao hero — `cover_url` vira background do próprio hero com
  véu da cor por cima (gradiente com alpha), em vez de bloco separado; pattern é
  ignorado quando há capa (evita poluição visual).
- 2026-07-19: catálogo passou a persistir a marca ativa, usar o app/Play Store correto
  no rodapé e mostrar as variações disponíveis/esgotadas sem revelar quantidades.
- 2026-07-19: o catálogo da Papelaria ganhou carrinho e criação pública de reserva por
  quatro horas; preço e disponibilidade são recalculados no backend de varejo.
- 2026-06-09: limite freemium — plano free exibe no máximo 3 produtos no catálogo
  público (reduzido de 5→3 em 2026-06-16; `totalProducts` no DTO traz o total real; página mostra "Mostrando X de Y").
  Rodapé ganhou a logo do app embutida em base64 (`catalog-logo.ts`).
- 2026-06-10: estado vazio da página com cesta SVG inline da marca (antes emoji 🧺,
  que renderizava diferente por aparelho); logo do rodapé em chip claro com sombra.
- 2026-06-25: **faixa promocional** (`promo_banner`, migration 023; máx 60 chars) — texto
  opcional renderizado como tira no topo da página pública (`.promo`, cor `palette.dark`).
  Mesmo gate Premium dos demais campos de personalização (`wantsCustomization` + null no
  público quando o dono não é premium).
- 2026-06-25: **galeria de fotos do produto** — `PublicCatalogProduct.extraPhotos` (lido de
  `products.extra_photos`); quando o produto tem mais de uma foto, o card renderiza um carrossel
  horizontal `.gallery` (scroll-snap CSS puro, sem JS) com `[photoUrl, ...extraPhotos]`. Fotos
  extras são geradas/limitadas na feature `products` (1 grátis / 3 Premium).
- 2026-07-11: rodapé virou CTA — "Feito com carinho no Lucro Caseiro" agora linka pra
  ficha da Play Store (UTM `catalogo`) e ganhou um botão extra "Crie sua vitrine grátis"
  com o mesmo link, pra converter visitantes do catálogo em instalações.
