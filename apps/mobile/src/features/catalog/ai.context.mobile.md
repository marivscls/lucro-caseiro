# ai.context.mobile.md — Catalog (Catálogo Online)

---

## Purpose

Configurar e compartilhar o catálogo público: ativar/desativar, escolher o endereço
(slug) e o WhatsApp de pedidos, e compartilhar o link da página pública servida pela
API (`/c/:slug`).

## Non-goals

- Não renderiza o catálogo (a página é HTML servida pela API).
- Não gerencia produtos (feature `products`); o catálogo mostra os produtos ativos.
- Não processa pedidos (acontecem no WhatsApp do usuário).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`CatalogSettings`, `UpdateCatalogSettings`),
  `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Counterpart de API:** feature `catalog` (`/api/v1/catalog/settings` + `/c/:slug`).
- **Dependentes:** tela `app/catalog.tsx`; item "Catálogo online" em `tabs/more.tsx`.

## Code pointers

| Arquivo                                     | Descricao                                                   |
| ------------------------------------------- | ----------------------------------------------------------- |
| `apps/mobile/src/features/catalog/api.ts`   | fetch/update settings + `publicCatalogUrl(slug)`            |
| `apps/mobile/src/features/catalog/hooks.ts` | `useCatalogSettings`, `useUpdateCatalogSettings`            |
| `apps/mobile/src/app/catalog.tsx`           | Tela de configuração (switch, slug, whatsapp, compartilhar) |

## Components

### `CatalogScreen` / `CatalogForm` (locais na tela)

- Switch "Catálogo ativo" — salva `enabled` imediatamente.
- Inputs de endereço (slug) e WhatsApp + botão "Salvar".
- Botão "Compartilhar link do catálogo" (`Share.share`) quando ativo.
- Erros 400 da API (slug inválido/em uso) mostram a mensagem do backend no Alert.

## Hooks

| Hook                         | Tipo          | Descricao                                                                 |
| ---------------------------- | ------------- | ------------------------------------------------------------------------- |
| `useCatalogSettings()`       | `useQuery`    | Settings (API cria defaults na 1a chamada). Key: `["catalog","settings"]` |
| `useUpdateCatalogSettings()` | `useMutation` | PUT settings; invalida `["catalog"]`                                      |

## API Integration

| Endpoint                   | Verbo | Funcao                  |
| -------------------------- | ----- | ----------------------- |
| `/api/v1/catalog/settings` | GET   | `fetchCatalogSettings`  |
| `/api/v1/catalog/settings` | PUT   | `updateCatalogSettings` |

Link público: `publicCatalogUrl(slug)` = `EXPO_PUBLIC_API_URL + /c/ + slug`.

## Contracts

- `CatalogSettings` — `{ slug, enabled, whatsapp, updatedAt }`.
- `UpdateCatalogSettings` — `{ slug?, enabled?, whatsapp? }`.

## Error Handling

- 400 (slug inválido/em uso): Alert com a mensagem em português vinda do backend.
- Outros erros: `Alert.alert("Erro", "Não foi possível salvar. Tente novamente.")`.

## Performance

- Settings em cache do React Query; mutation invalida e refaz 1 query leve.

## Test matrix

- [ ] Settings carregam e populam o formulário
- [ ] Toggle salva `enabled` imediatamente
- [ ] Salvar envia slug normalizado (trim + lowercase) e whatsapp (null se vazio)
- [ ] Erro 400 mostra mensagem do backend
- [ ] Compartilhar usa o link `/c/:slug`

## Examples

- Acesso: aba "Mais" → "Catálogo online". Rota: `/catalog`.

## Change log / Decisions

- 2026-06-09: criação (MVP). Página pública é HTML da API (sem web app novo); o
  mobile só configura e compartilha o link.
- 2026-06-09: visual premium — hero com ícone de loja e badge de status, card "Seu link"
  (pill tocável + botão compartilhar, visível só com catálogo ativo), seções com ícones.
  Tela trata erro com botão "Tentar de novo". Mensagem de compartilhamento mais calorosa.
- 2026-06-09: card "Aparência" (Premium, badge): capa (galeria → `uploadCatalogCover` no
  bucket `product-photos`), 6 cores preset (swatches) e frase de apresentação. Free: tocar
  abre o paywall (`usePaywall("catalog")`); backend reforça via LIMIT_EXCEEDED.
- 2026-06-09: campo de cor hexadecimal livre no card Aparência (preview + "Aplicar";
  aceita com/sem `#`, valida 6 dígitos).
- 2026-06-09: foto de perfil no card Aparência (`uploadCatalogLogo`) — círculo tocável
  com remover; mesmo gate Premium.
- 2026-06-09: UX da cor custom — bolinha "+" ao lado dos presets abre `ColorPickerModal`
  (components/color-picker-modal.tsx: quadro saturação/brilho + barra de matiz em SVG,
  campo hex, confirmar/cancelar). Estampas do topo (nenhum/pontinhos/bolinhas/
  quadriculado/listras) em bolinhas abaixo das cores; mesmo gate Premium.
- 2026-06-09: UX — botão "Salvar" único (primário, fim da tela) salva endereço, WhatsApp
  e frase juntos (frase só entra no payload se premium); prévia local imediata de
  capa/foto de perfil após escolher na galeria; `HeroPreview`
  (components/hero-preview.tsx, SVG) mostra o topo com cor+estampa+frase em tempo real,
  entre as estampas e a frase.
- 2026-06-09: banner de upgrade para free ("Seu catálogo mostra até 3 produtos") com
  CTA para o paywall, refletindo o limite de 3 produtos aplicado no backend (reduzido de 5→3 em 2026-06-16).
- 2026-06-25: campo "Faixa promocional" (máx 60) no card Aparência, abaixo da frase —
  salva junto no payload só se premium (`promoBanner`); vira tira no topo do catálogo público.
- 2026-07-18: a primeira transição de catálogo desativado para ativo registra
  `catalog_published`. O rodapé público mantém o selo/CTA “Feito com Lucro Caseiro” e o link da
  Play Store usa referrer com origem, meio e campanha do catálogo compartilhado.
