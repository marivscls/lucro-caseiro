# API Deploy — Lucro Caseiro

Guia de deploy do backend (`apps/api`). A API e um servidor Express + Postgres (via Supabase). Para assinaturas Android, ela valida compras com a Google Play Developer API.

## Recomendacao

**Railway** — mais simples para esse stack (auto-detecta pnpm monorepo, HTTPS automatico, $5/mes free tier).

Alternativas equivalentes: **Fly.io** (free tier maior, exige `flyctl`), **Render** (free tier com sleep apos 15 min ocioso), **VPS** (DigitalOcean/Hetzner, ~$6/mes, controle total).

---

## Variaveis de ambiente (todas as opcoes)

Lista completa em [apps/api/.env.example](../apps/api/.env.example). Resumo:

| Variavel                           | Obrigatoria | Descricao                                                    |
| ---------------------------------- | ----------- | ------------------------------------------------------------ |
| `DATABASE_URL`                     | sim         | Postgres connection string (Supabase pooler, porta 5432)     |
| `SUPABASE_URL`                     | sim         | URL do projeto Supabase                                      |
| `SUPABASE_ANON_KEY`                | sim         | Anon key (publica) do Supabase                               |
| `API_PORT`                         | nao         | Porta interna (default 3001 — Railway/Fly mapeiam pra fora)  |
| `CORS_ORIGIN`                      | nao         | Origens permitidas (comma-separated, default `*`)            |
| `GOOGLE_PLAY_PACKAGE_NAME`         | sim         | Package name Android (`br.com.orionseven.lucrocaseiro`)      |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | sim         | JSON da service account para validar assinaturas Google Play |
| `STRIPE_SECRET_KEY`                | sim         | Secret key live da Stripe (`sk_live_...`)                    |
| `STRIPE_WEBHOOK_SECRET`            | sim         | Signing secret do webhook Stripe (`whsec_...`)               |
| `STRIPE_PRICE_MONTHLY_ID`          | sim         | ID do Price mensal recorrente (`price_...`)                  |
| `STRIPE_PRICE_ANNUAL_ID`           | sim         | ID do Price anual recorrente (`price_...`)                   |
| `STRIPE_SUCCESS_URL`               | sim         | URL de retorno apos checkout aprovado                        |
| `STRIPE_CANCEL_URL`                | sim         | URL de retorno apos checkout cancelado                       |

---

## Opcao 1 — Railway (recomendado)

1. Criar conta em [railway.app](https://railway.app) e logar com GitHub.
2. **New Project** → **Deploy from GitHub repo** → selecionar `lucro-caseiro`.
3. Em **Settings** do servico criado:
   - **Root Directory**: deixar vazio (o repo raiz e onde fica o `pnpm-workspace.yaml`)
   - **Build Command**: `pnpm install --frozen-lockfile --ignore-scripts`
   - **Start Command**: `pnpm --filter @lucro-caseiro/api start`
   - **Watch Paths** (opcional): `apps/api/**` e `packages/**` para nao redeployar em mudancas mobile-only
4. **Variables** → colar as vars da [.env.example](../apps/api/.env.example) com valores reais.
5. **Settings → Networking → Generate Domain** — Railway gera `<service>.up.railway.app`. Anotar essa URL.
6. Aguardar deploy (~2 min). Verificar:
   ```
   curl https://<seu-dominio>.up.railway.app/api/v1/health
   ```
   Deve retornar `{"status":"ok"}`.

### Custom domain (opcional)

Em **Settings → Networking → Custom Domain** → adicionar `api.lucrocaseiro.app` (ou subdominio do Orion). Railway da o CNAME pra apontar no seu DNS.

---

## Opcao 2 — Fly.io

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Na raiz do repo
fly launch --no-deploy --copy-config --name lucro-caseiro-api
# Vai criar fly.toml na raiz. Aceitar Postgres? NAO (usamos Supabase)
# Aceitar Redis? NAO

# Settar secrets
fly secrets set DATABASE_URL="postgresql://..." \
  SUPABASE_URL="https://..." \
  SUPABASE_ANON_KEY="..." \
  GOOGLE_PLAY_PACKAGE_NAME="br.com.orionseven.lucrocaseiro" \
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Deploy
fly deploy
```

Fly usa o Dockerfile em `apps/api/Dockerfile` (precisa ajustar `dockerfile = "apps/api/Dockerfile"` e `build.target` no `fly.toml` se necessario).

---

## Opcao 3 — Render

1. [render.com](https://render.com) → **New** → **Web Service** → conectar repo.
2. **Environment**: `Docker`
3. **Dockerfile Path**: `apps/api/Dockerfile`
4. **Docker Build Context Directory**: `.` (raiz do repo)
5. Settar env vars no painel.
6. Deploy automatico em cada push pra `main`.

> Free tier do Render dorme apos 15 min sem trafego — primeiro request demora 30s. Webhooks podem timeout. Use plano pago ($7/mo) ou Railway.

---

## Verificacao apos deploy

1. Health check: `curl https://<api>/api/v1/health` → `200 ok`
2. Tentar logar no app mobile (com `EXPO_PUBLIC_API_URL` apontando pro novo dominio) — deve cadastrar sem erro
3. Testar sync seguro da assinatura com um usuario logado e um token real do Google Play:
   ```bash
   curl -X POST https://<api>/api/v1/subscription/sync-plan \
     -H "Authorization: Bearer <JWT_DO_USUARIO>" \
     -H "Content-Type: application/json" \
     -d '{"platform":"android","productId":"lucrocaseiro_premium_monthly","purchaseToken":"<GOOGLE_PLAY_PURCHASE_TOKEN>"}'
   ```
   Deve consultar o Google Play no servidor e retornar o perfil atualizado.

---

## Configurar mobile pra apontar pra producao

Em [apps/mobile/app.json](../apps/mobile/app.json), o app le a URL da API de uma variavel `EXPO_PUBLIC_API_URL` (configurar via `eas secret:create` ou diretamente no `app.json` em `expo.extra`).

Para o lancamento, settar:

```json
"extra": {
  "apiUrl": "https://<seu-api>.up.railway.app"
}
```

Ou via env: `EXPO_PUBLIC_API_URL=https://...` no `eas build`.

---

## Custos estimados (lancamento Android-first, ~100 usuarios free + 5 premium)

| Host    | Plano        | Custo/mes | Limite                                  |
| ------- | ------------ | --------- | --------------------------------------- |
| Railway | Hobby        | ~$5       | $5 credit free, paga consumo alem disso |
| Fly.io  | Hobby        | ~$0       | 3 shared CPU + 256MB RAM gratis         |
| Render  | Starter      | ~$7       | sem sleep                               |
| Render  | Free         | $0        | sleep apos 15min                        |
| VPS     | Hetzner CX11 | ~$5       | 1 vCPU + 2GB RAM, controle total        |

Recomendacao para os primeiros 6 meses: **Railway Hobby** (deploy git-connected zero-config, $5/mo geralmente suficiente).
