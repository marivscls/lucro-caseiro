# ai.context.api.md — Catalog (Catálogo Público)

---

## Purpose

Catálogo público compartilhável: uma página web (HTML servida pela própria API, sem
infra extra) com os produtos ativos do usuário e botão de pedido via WhatsApp. O
usuário ativa/desativa, escolhe o endereço (`slug`) e o WhatsApp de pedidos no app.

## Non-goals

- Não processa pedidos/pagamentos (o pedido acontece no WhatsApp).
- Não gerencia produtos (feature `products`); apenas lê produtos ativos.
- Não tem carrinho, estoque visível nem preços promocionais.
- Não tem SEO avançado/domínio próprio (futuro premium).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (CatalogSettings, UpdateCatalogSettings,
  PublicCatalog), `@lucro-caseiro/database/schema` (catalogSettings, products, users).
- **Composição**: nenhuma injeção cross-feature; repo próprio lê `products`/`users`.
- **Dependentes**: mobile feature `catalog`.

## Code pointers

- `catalog.routes.ts` — `createCatalogRouter` (autenticado) e `createPublicCatalogRouter` (público)
- `catalog.usecases.ts` — settings (defaults lazy, validação de slug), catálogo público
- `catalog.domain.ts` — `slugify`, `isValidSlug`, `renderCatalogHtml` (puros)
- `catalog.repo.pg.ts` — persistência de settings + leitura de produtos ativos
- `catalog.types.ts` — `ICatalogRepo`, `CatalogOwner`

## Data Model

- `catalog_settings` (migration 011): `user_id` PK → users (cascade), `slug` UNIQUE,
  `enabled` (default false), `whatsapp` (nullable; fallback `users.phone`), `updated_at`.
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
- `/c/:slug`: público por design (sem auth). Exposição limitada a businessName,
  whatsapp escolhido e produtos ativos (nome, descrição, foto, preço).

## Contracts (Zod/DTO)

- `CatalogSettingsDto` — `{ slug, enabled, whatsapp, updatedAt }`
- `UpdateCatalogSettingsDto` — `{ slug?, enabled?, whatsapp? }` (slug validado por regex)
- `PublicCatalogDto` — `{ businessName, whatsapp, products[] }`

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

- `GET /c/doces-da-maria` → página HTML com produtos e botões `wa.me`.
- `PUT /api/v1/catalog/settings` `{ "enabled": true, "slug": "doces-da-maria" }`.

## Change log / Decisions

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
- 2026-06-09: limite freemium — plano free exibe no máximo 5 produtos no catálogo
  público (`totalProducts` no DTO traz o total real; página mostra "Mostrando X de Y").
  Rodapé ganhou a logo do app embutida em base64 (`catalog-logo.ts`).
