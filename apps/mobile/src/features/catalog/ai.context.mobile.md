# ai.context.mobile.md — Catalog (Catálogo Online)

---

## Purpose

Configurar e compartilhar o catálogo público: ativar/desativar, escolher o endereço
(slug) e o WhatsApp de pedidos, e compartilhar o link da página pública servida pela
API (`/c/:slug`).

## Non-goals

- Não gerencia produtos (feature `products`); o catálogo mostra os produtos ativos.
- Não processa pedidos (acontecem no WhatsApp do usuário).
- Não remove fundo de imagens; `hero.removeBackground` só escolhe recorte vs foto original.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`CatalogSettings`, `UpdateCatalogSettings`),
  `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Counterpart de API:** feature `catalog` (`/api/v1/catalog/settings` + `/c/:slug`).
- **Dependentes:** tela `app/catalog.tsx`; item "Catálogo online" em destaque em `tabs/more.tsx` (Gestão do negócio).

## Code pointers

| Arquivo                                                              | Descricao                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/mobile/src/features/catalog/api.ts`                            | fetch/update settings + `publicCatalogUrl(slug)`            |
| `apps/mobile/src/features/catalog/hooks.ts`                          | `useCatalogSettings`, `useUpdateCatalogSettings`            |
| `apps/mobile/src/features/catalog/catalog-customizer.ts`             | Estado, validação e `displayCatalogItemName` do editor      |
| `apps/mobile/src/features/catalog/components/catalog-customizer.tsx` | Fluxo Identidade / Topo / Publicação                        |
| `apps/mobile/src/features/catalog/components/storefront-preview.tsx` | Prévias administrativas alinhadas ao renderer público       |
| `apps/mobile/src/app/catalog.tsx`                                    | Tela de configuração (switch, slug, whatsapp, compartilhar) |
| `apps/mobile/src/app/c/[slug].tsx`                                   | Redireciona `/c/:slug` do PWA para a vitrine pública        |

## Components

### `CatalogScreen` / `CatalogForm` (locais na tela)

- Switch "Catálogo ativo" — salva `enabled` imediatamente.
- Inputs de endereço (slug) e WhatsApp + botão "Salvar".
- Botão "Compartilhar no WhatsApp" abre o seletor de conversas com a mensagem pronta;
  "Outras opções" mantém o compartilhamento nativo (`Share.share`).
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

- `CatalogSettings` inclui identidade compartilhada e apresentação separada de Produtos/Serviços.
- `UpdateCatalogSettings` aceita `serviceCoverUrl`, `serviceTagline` e `servicePromoBanner` para a vitrine de serviços.

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
- [ ] WhatsApp abre com a mensagem e o link da vitrine preenchidos

## Examples

- Acesso: aba "Mais" → Gestão do negócio → "Catálogo online" (visível sem "Ver tudo"). Rota: `/catalog`.

## Change log / Decisions

- 2026-08-31: o sheet Mais opções reserva a área segura de baixo
  (`insets.bottom`) para “Desativar catálogo” não colar na barra do sistema.

- 2026-08-31: Ver como cliente (vitrine pública) alarga os cards de
  Destaques no celular e encurta o cartão vazio sem foto; nomes quebram
  em 2 linhas em vez de cortar no meio.

- 2026-08-29: a grade pública “Escolha o que deseja” passou a cards
  verticais (foto em cima, nome e preço embaixo), iguais à prévia local.

- 2026-08-29: “Página no ar” busca o HTML de `/c/:slug` e mostra em
  `srcDoc` (a página pública manda `X-Frame-Options: DENY`, então o
  iframe com `src` fica em branco). O rascunho continua na prévia local.

- 2026-08-29: na prévia do editor, Pedir/Agendar e as abas Produtos/
  Serviços viram pílulas compactas. A faixa de destaques cabe até 3
  cards inteiros; se houver mais, desliza. A grade “Escolha o que deseja”
  usa cards verticais para o nome e o valor não quebrarem.

- 2026-08-29: a prévia local acompanha a vitrine pública densa — capa
  curta, card sobreposto com logo circular, busca “Buscar no catálogo”,
  chips, destaques horizontais e grade “Escolha o que deseja”. Contagens
  reais de produtos/serviços ficam no card da loja.

- 2026-08-29: em Texto e ação dá para escolher a cor do título (nome e
  headings) e a cor da frase (apresentação e assinatura). O fundo
  continua no creme da marca; a cor dos botões segue em Identidade.
  `applySimpleStorefrontPresentation` deixa de forçar o vinho do texto.

- 2026-08-29: o Topo voltou a ter estilo do banner (Clássico, Editorial,
  Compacto), assinatura curta e até 3 informações rápidas. Busca, filtros
  e canais além do WhatsApp continuam fora.

- 2026-08-29: o Topo voltou a ter ajuste da capa (`coverFocal`: setas,
  zoom e Centralizar) e texto do botão de cada item (padrão Pedir/Agendar
  - sobrescrita por produto/serviço). Tipo de ação e canais continuam
    só WhatsApp.

- 2026-08-29: o editor da vitrine ficou em três passos — Identidade
  (logo, nome, cor dos botões), Topo (estilo do banner, capa, até 3
  destaques, recorte, textos, botão de contato, faixa e texto dos botões
  dos itens) e Publicação (WhatsApp, rótulo do botão flutuante, mensagem
  inicial, endereço e QR). Busca, filtros, cards por item e canais
  além do WhatsApp saíram da tela; ao carregar e ao salvar,
  `applySimpleStorefrontPresentation` força cards editoriais,
  produtos+serviços visíveis, ações no WhatsApp (Pedir/Agendar, com o texto
  que a pessoa escolheu) e o fundo creme da marca. Estilo do banner,
  assinatura, informações rápidas e cores de título/frase são preservados.

- 2026-08-29: o topo da vitrine não pede mais tipo de ação (WhatsApp,
  orçamento, agendamento, link). Só o texto do botão de contato, que abre
  o WhatsApp. Sem texto, o botão some.

- 2026-08-29: o editor do topo não oferece mais “Ajustar posição e tamanho”
  (capa e destaques). A arte entra como enviada; `coverFocal` e transforms
  já salvos continuam valendo na vitrine publicada.

- 2026-08-29: as setas de posição da capa (`coverFocal`) passam a recortar
  a prévia (object-position na web, translate no nativo). Antes só o zoom
  alterava a imagem.

- 2026-08-29: “Ver detalhes” na prévia local abre um diálogo com nome,
  preço e descrição. A prévia publicada (iframe) permite `allow-modals`.

- 2026-08-29: o modal “Ver prévia” (Rascunho) renderiza a vitrine sem o
  chrome “PRÉVIA FINAL”. O topo empilha texto e destaques abaixo de 480 px
  para o CTA “Entrar em contato” não quebrar.

- 2026-08-29: “Ver prévia” abre o rascunho local (cards do app, grade 2
  colunas). Na web, o seletor “Página no ar” busca o HTML da API.

- 2026-08-29: a prévia local dos cards (fallback quando o HTML não abre)
  empilha status e CTA, mostra “a partir de” só com faixa de preço, usa check
  para disponibilidade e um selo circular quando o item não tem foto.

- 2026-08-19: “Salvar e publicar” abre um popup no editor (“Salvo e
  publicado”) porque o toast/alerta globais ficam atrás do modal do
  personalizador.

- 2026-08-19: “Copiar link” (Publicação e modal do QR) confirma no próprio
  botão (“Copiado!”) porque o toast global fica atrás do modal.

- 2026-08-19: o toggle “Remover fundo automaticamente” grava `hero.removeBackground`.
  Ligado, a prévia e o catálogo público usam `processedUrl` quando existe e
  tratam o destaque como recorte; desligado, voltam à foto original.

- 2026-08-25: no celular, a navbar flutuante do app (`MobileFloatingTabBar` no
  root) cobre Catálogo e o editor em modal; o chrome do editor reserva
  `floatingTabBarReserve`.

- 2026-08-19: no computador (shell ≥1024), Personalizar vitrine fica no painel
  do app — sem modal em tela cheia nem navbar. Em 1200px+ o editor usa
  formulário + prévia sticky (padrão Precificação) em Identidade, Topo
  e Publicação; CTAs ficam no aside. Abaixo disso o computador
  mantém uma coluna, sem esticar controles. A prévia HTML abre em painel
  centralizado.

- 2026-08-19: a prévia administrativa consome o rascunho e a `coverUrl`
  real; logo, capa e destaques são campos separados. Prefixos técnicos
  como `[massa]` são removidos no formatter (`displayCatalogItemName`)
  antes de cards, listas e seletores. O header (título + steppers) e a
  barra de ações ficam fora do scroll; o conteúdo reserva o espaço da
  navbar. Sem capa, o estado vazio é compacto e o frontend não recria
  arte vinho.

- 2026-08-19: o editor da vitrine (Identidade, Publicação e demais passos) usa a
  paleta do tema no chrome. A prévia interna da loja continua com as cores
  escolhidas pelo usuário. Se o HTML da prévia falhar na web, o app mostra a
  prévia local em vez do alerta "Não foi possível abrir a prévia".

- 2026-08-01: a área Aparência alterna entre Produtos e Serviços. Capa, frase e faixa promocional são próprias de cada vitrine; foto de perfil, WhatsApp e cor permanecem compartilhados.

- 2026-07-29: rota pública `app/c/[slug].tsx` — quem abre `/c/:slug` no domínio do
  PWA é redirecionado para `publicCatalogUrl(slug)` (preserva `?produto=`/`#produto-`);
  fora do `DesktopShell` e sem gate de auth. No nativo abre o link no navegador.

- 2026-07-28: a vitrine compartilhável também expõe serviços públicos; pedidos
  de horário são triados no painel de cada serviço e não confirmam a agenda sozinhos.

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
- 2026-08-29: Catálogo online saiu de "Ver tudo" e passou ao grid visível de Gestão no Mais.
- 2026-08-29: thumbs de identidade na tela de Catálogo usam `key={`identity-${index}`}`
  (não a URL da foto) — a massa de teste reutiliza a mesma imagem em vários produtos.
  Categorias da prévia usam índice + nome. A lista de visibilidade também formata
  nomes com `displayCatalogItemName`.
- 2026-08-31: o hero do Catálogo no nativo volta ao layout da vitrine PWA:
  ilustração 3D maior vazando o card vinho (topo e direita), título em duas
  linhas e o texto “Produtos e serviços organizados para seus clientes
  escolherem.”. Largura/altura explícitas no PNG para o Android não estourar
  o tamanho intrínseco.
- 2026-08-31: no card da vitrine, os rótulos produtos/serviços/publicados
  ficam numa linha abaixo do ícone e do número, sem reticências.
- 2026-08-31: “Ver como cliente” e “Mais opções” usam a mesma fonte/tamanho
  (`fitTitle={false}`); o texto mais longo não encolhe.
- 2026-08-31: no mobile a ilustração 3D fica menor e mais baixa (dentro do
  card vinho), para o título respirar e a sacola não subir em cima do texto.
