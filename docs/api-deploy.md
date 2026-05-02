# API Deploy — Lucro Caseiro

Guia de deploy do backend (`apps/api`). A API e um servidor Express + Postgres (via Supabase) e precisa de URL publica HTTPS para receber webhooks do RevenueCat e do Mercado Pago.

## Recomendacao

**Railway** — mais simples para esse stack (auto-detecta pnpm monorepo, HTTPS automatico, $5/mes free tier).

Alternativas equivalentes: **Fly.io** (free tier maior, exige `flyctl`), **Render** (free tier com sleep apos 15 min ocioso), **VPS** (DigitalOcean/Hetzner, ~$6/mes, controle total).

---

## Variaveis de ambiente (todas as opcoes)

Lista completa em [apps/api/.env.example](../apps/api/.env.example). Resumo:

| Variavel                      | Obrigatoria | Descricao                                                   |
| ----------------------------- | ----------- | ----------------------------------------------------------- |
| `DATABASE_URL`                | sim         | Postgres connection string (Supabase pooler, porta 5432)    |
| `SUPABASE_URL`                | sim         | URL do projeto Supabase                                     |
| `SUPABASE_ANON_KEY`           | sim         | Anon key (publica) do Supabase                              |
| `API_PORT`                    | nao         | Porta interna (default 3001 — Railway/Fly mapeiam pra fora) |
| `CORS_ORIGIN`                 | nao         | Origens permitidas (comma-separated, default `*`)           |
| `REVENUECAT_WEBHOOK_SECRET`   | recomendado | Secret pra validar webhooks RevenueCat                      |
| `MERCADOPAGO_ACCESS_TOKEN`    | opcional    | Token MP (so se ativar PIX/cartao alternativo)              |
| `MERCADOPAGO_WEBHOOK_SECRET`  | opcional    | Secret HMAC do webhook MP                                   |
| `MERCADOPAGO_PLAN_MONTHLY_ID` | opcional    | ID do preapproval_plan mensal                               |
| `MERCADOPAGO_PLAN_ANNUAL_ID`  | opcional    | ID do preapproval_plan anual                                |

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
  REVENUECAT_WEBHOOK_SECRET="..."

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
3. Testar webhook RevenueCat:
   ```bash
   curl -X POST https://<api>/api/v1/webhooks/revenuecat \
     -H "Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>" \
     -H "Content-Type: application/json" \
     -d '{"event":{"type":"TEST","app_user_id":"test","expiration_at_ms":null,"event_timestamp_ms":0}}'
   ```
   Deve retornar `{"ok":true}`.

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
