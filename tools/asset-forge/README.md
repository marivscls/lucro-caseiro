# asset-forge 🎨

Sistema que **resolve a ilustração (PNG 3D) de cada insumo/produto pelo nome** — com
biblioteca curada + geração sob demanda + cache. Ferramenta **isolada** (fora do
workspace pnpm; não entra nos gates de lint/typecheck/test dos apps). Roda em Node ≥ 22,
**sem dependências** (`node` + `node --test`).

## Por que existe

O app não tem (nem vai ter) um PNG para cada nome que o usuário inventa
("Leite Condensado Moça 395g", "Caixa para bolo"…). Em vez de embutir centenas de
imagens, o app pergunta pelo **nome** e este sistema devolve a melhor ilustração,
caindo num **fallback** (emoji + cor) quando ainda não há imagem — nunca trava, funciona
offline.

## Arquitetura (3 camadas)

```
[App] --nome--> resolveIngredient(nome)
                  │  hit no catálogo/manifest -> URL do PNG (CDN)   → mostra imagem
                  │  enquanto não há PNG       -> emoji + cor        → fallback instantâneo
                  ▼
        [asset-forge]  gera o PNG (provider) -> salva no Storage -> manifest (cache por slug)
```

- **Catálogo curado** (`seeds/ingredients.json`): itens comuns de confeitaria/cozinha,
  cada um com `slug`, `label`, `emoji`, `color`, `aliases`. É a fonte do **fallback** e do
  match por nome.
- **Resolver** (`src/catalog.mjs`): normaliza o nome (tira acento, número, unidade,
  stopword) e casa com o alias mais específico. `"Leite Condensado Moça 395g"` →
  `leite-condensado` (não `leite`).
- **Prompt** (`src/prompt.mjs`): estilo visual **único** para todas as imagens combinarem.
- **Provider** (`src/providers.mjs`): interface plugável de geração. `dry-run` (offline,
  padrão) ou `http` (seu worker que chama o modelo de imagem).
- **Manifest** (`out/manifest.json`): cache/estado por `slug` (status, url, prompt). É o
  que o app lê para achar a URL. **Cache por slug = compartilhado**: gera 1x por item e
  serve todos os usuários (custo não escala com a base).

> ⚠️ Geração de imagem **não é** Claude (o Claude é texto/visão-de-entrada). Use um modelo
> de imagem (difusão) atrás do provider `http`. O Claude/Anthropic API ajuda no que é
> "inteligência de texto": normalizar nome → slug, montar o prompt e moderar o resultado.

## Comandos

```bash
cd tools/asset-forge

node cli.mjs resolve "Leite Condensado Moça 395g"   # debug: que ilustração casa?
node cli.mjs catalog                                # exporta out/catalog.json (consumo do app)
node cli.mjs build                                  # cria out/manifest.json (prompts, status pending)
node cli.mjs gen --all                              # gera tudo via provider
node cli.mjs gen "Brigadeiro" "Farinha"             # gera itens específicos
node --test                                         # testes (normalize + catálogo)
```

## Worker de geração (`worker.mjs`)

O **worker** é o endpoint que o provider `http` consome. Ele recebe `{ prompt, slug }`,
gera a imagem (adapter de modelo) e — se houver Supabase configurado — faz upload e
devolve `{ url }`; senão devolve `{ b64 }` (a CLI salva em `out/png/`).

```bash
# 1) sobe o worker (modo stub: gera um PNG real de placeholder, offline)
node worker.mjs            # http://localhost:8787  (GET /health para checar)

# 2) em outro terminal, gera apontando a CLI pro worker
ASSET_FORGE_PROVIDER=http ASSET_FORGE_IMAGE_ENDPOINT=http://localhost:8787 node cli.mjs gen --all
```

### Adapters de imagem (`src/image-adapters.mjs`)

- **stub** (padrão, offline): gera um PNG real (círculo na cor do item) via encoder
  próprio em `node:zlib` — sem rede, sem chave. Serve pra validar o fluxo inteiro.
- **openai** (`OPENAI_API_KEY`): exemplo de modelo real (OpenAI Images). Trocar por
  Stability/Replicate/fal/Imagen = escrever outro adapter com a mesma interface.

### Storage (`src/storage.mjs`)

- **supabase** (`SUPABASE_URL` + `SUPABASE_SERVICE_KEY`, bucket `ASSET_FORGE_BUCKET`
  ou `illustrations`): faz upload e devolve a URL pública.
- sem config: o worker devolve `{ b64 }` e a CLI salva o PNG localmente.

```bash
# geração real ponta a ponta:
export OPENAI_API_KEY=...
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_SERVICE_KEY=...        # service role (upload no Storage)
node worker.mjs
ASSET_FORGE_PROVIDER=http ASSET_FORGE_IMAGE_ENDPOINT=http://localhost:8787 node cli.mjs gen --all
```

> Para produção, o `worker.mjs` é portátil — a mesma lógica vira uma Supabase Edge
> Function / micro-serviço. O `manifest.json` guarda as URLs e o app passa a exibir os PNGs.

## Como o app consome (próximo passo)

1. `node cli.mjs catalog` gera `out/catalog.json` (slug, label, emoji, color, aliases).
2. O app embute esse catálogo e tem um `IngredientAvatar(nome)` que:
   - resolve `slug` → se houver `url` no manifest/CDN, mostra `<Image>`;
   - senão, mostra **emoji + círculo na cor** (fallback instantâneo, offline).
3. Quando o asset-forge gerar os PNGs e publicar as URLs, o avatar passa a exibir as
   imagens **sem mudar a tela**.

## Estrutura

```
tools/asset-forge/
  cli.mjs                 # CLI (resolve | catalog | build | gen)
  seeds/ingredients.json  # biblioteca curada (fonte do fallback + match)
  src/
    normalize.mjs         # nome livre -> forma canônica / slug
    catalog.mjs           # resolver (nome -> entrada do catálogo)
    prompt.mjs            # estilo único de geração
    providers.mjs         # dry-run | http (plugável)
    manifest.mjs          # cache/estado (load/save)
    generate.mjs          # orquestra resolve -> prompt -> provider -> arquivo
  test/                   # node --test (sem deps)
  out/                    # gerado (gitignored): manifest.json, catalog.json, png/
```
