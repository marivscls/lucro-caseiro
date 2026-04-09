# ai.context.api.md — Subscription

---

## Purpose

Gerenciar perfil do usuario, plano de assinatura (Free/Premium) e limites freemium. Centraliza a logica de verificacao de limites para vendas/mes, clientes, receitas e embalagens. Permite ativar/desativar Premium e consultar uso atual vs limites.

## Non-goals

- Nao processa pagamentos (apenas gerencia o estado do plano)
- Nao faz integracao com App Store/Play Store para assinaturas
- Nao envia emails ou notificacoes de limite
- Nao faz enforcement automatico de limites nas outras features (cada feature deve consultar)

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (UpdateProfileDto, UserProfile, FreemiumLimits), `@lucro-caseiro/database/schema` (users, sales, clients, recipes, packaging)
- **Dependentes**: Todas as features consultam limites freemium (Sales, Clients, Recipes, Packaging)
- **Cross-feature**: Le tabelas de outras features para contagem de recursos (sales, clients, recipes, packaging)

## Code pointers

- `apps/api/src/features/subscription/subscription.routes.ts` — rotas Express
- `apps/api/src/features/subscription/subscription.usecases.ts` — logica de negocio
- `apps/api/src/features/subscription/subscription.domain.ts` — limites, verificacao de plano e mensagens
- `apps/api/src/features/subscription/subscription.repo.pg.ts` — persistencia Drizzle/Postgres
- `apps/api/src/features/subscription/subscription.types.ts` — interfaces e tipos
- `apps/api/src/features/subscription/subscription.domain.test.ts` — testes de dominio
- `apps/api/src/features/subscription/subscription.usecases.test.ts` — testes de usecases

## Data Model

### Tabela: `users`

| Coluna        | Tipo      | Constraints                                                       |
| ------------- | --------- | ----------------------------------------------------------------- |
| id            | uuid      | PK (vem do auth provider)                                         |
| email         | varchar   | NOT NULL, UNIQUE                                                  |
| name          | varchar   | NOT NULL                                                          |
| phone         | varchar   | nullable                                                          |
| businessName  | varchar   | nullable                                                          |
| businessType  | enum      | "food" \| "beauty" \| "crafts" \| "services" \| "other", nullable |
| plan          | enum      | "free" \| "premium", default "free"                               |
| planExpiresAt | timestamp | nullable                                                          |
| createdAt     | timestamp | default now()                                                     |

### Limites Free Plan (constantes)

| Recurso    | Limite Free |
| ---------- | ----------- |
| Vendas/mes | 30          |
| Clientes   | 20          |
| Receitas   | 5           |
| Embalagens | 3           |

## Invariants

- Plan e "free" ou "premium"
- Premium com expiresAt no passado = free (expirado)
- Premium sem expiresAt = premium permanente
- Limites freemium sao Infinity para premium
- `isLimitExceeded` retorna true quando count >= limit (>=, nao >)
- Mensagens de limite sao em portugues brasileiro
- Profile e upsert (insert on conflict update)

## Operations

```yaml
feature: subscription
app: api
mobile_counterpart: subscription
api:
  base: /api/v1/subscription
  endpoints:
    - method: GET
      path: /profile
      response: UserProfile
    - method: PATCH
      path: /profile
      dto: UpdateProfileDto
      response: UserProfile
    - method: GET
      path: /limits
      response: FreemiumLimits
db:
  tables:
    - users
  indexes:
    - users(id) PK
    - users(email) UNIQUE
  cross_tables_read:
    - sales (count por userId + mes)
    - clients (count por userId)
    - recipes (count por userId)
    - packaging (count por userId)
invariants:
  - plan in ["free", "premium"]
  - premium with past expiresAt = expired (treated as free)
  - free limits: sales=30/month, clients=20, recipes=5, packaging=3
  - limit exceeded when current >= max
```

## Authorization & RLS

- Todas as rotas protegidas por `authMiddleware`
- `userId` extraido do token JWT
- Profile acessivel apenas pelo proprio usuario
- Contagem de recursos usa queries escopadas por `userId`

## Contracts (Zod/DTO)

- **UpdateProfileDto**: `{ name?, phone?, businessName?, businessType? }`
- **UserProfile**: `{ id, email, name, phone, businessName, businessType, plan, planExpiresAt, createdAt }`
- **FreemiumLimits**: `{ maxSalesPerMonth, maxClients, maxRecipes, maxPackaging, currentSalesThisMonth, currentClients, currentRecipes, currentPackaging }`

## Errors

| Status | Quando                | Mensagem                |
| ------ | --------------------- | ----------------------- |
| 404    | Perfil nao encontrado | "Perfil nao encontrado" |

## Events / Side effects

- `ensureProfile`: upsert automatico no login (cria perfil se nao existe)
- `activatePremium` / `deactivatePremium`: funcoes internas (nao expostos via REST atualmente)
- Contagem de recursos faz queries em 4 tabelas em paralelo (`Promise.all`)

## Performance

- `getResourceCounts` faz 4 COUNT queries em paralelo
- Sales count filtrado por `soldAt >= startOfMonth` (usa inicio do mes atual)
- Profile lookup por PK (userId = id)

## Security

- Dados de perfil sao sensiveis (email, telefone)
- Isolamento por `userId`
- Limites freemium devem ser enforced no backend (nunca confiar no front)
- Plano nao pode ser alterado diretamente pelo usuario via API publica

## Test matrix

### Domain (subscription.domain.test.ts)

- buildFreemiumLimits: free com contagens, premium com Infinity
- isLimitExceeded: abaixo (false), no limite de cada recurso (true), zerado (false)
- getLimitMessage: portugues para cada tipo, menciona Premium
- isPremiumActive: free (false), premium sem expiry (true), premium futuro (true), premium expirado (false)

### UseCases (subscription.usecases.test.ts)

- getProfile: encontrado, NotFoundError
- updateProfile: atualiza campos, NotFoundError
- getLimits: free com contagens, premium com Infinity, NotFoundError
- isPremium: free (false), premium (true), expirado (false), nao encontrado (false)
- activatePremium: sucesso, NotFoundError
- deactivatePremium: sucesso

## Examples

```
GET /api/v1/subscription/profile
=> 200 { "id": "...", "name": "Maria", "plan": "free", "businessName": "Doces da Maria", ... }

PATCH /api/v1/subscription/profile
{ "businessName": "Doces Gourmet da Maria" }
=> 200 { "id": "...", "businessName": "Doces Gourmet da Maria", ... }

GET /api/v1/subscription/limits
=> 200 { "maxSalesPerMonth": 30, "maxClients": 20, "maxRecipes": 5, "maxPackaging": 3,
         "currentSalesThisMonth": 10, "currentClients": 5, "currentRecipes": 2, "currentPackaging": 1 }
```

## Change log / Decisions

- Criacao inicial com profile + limites freemium
- Limites hardcoded como constantes (FREE_PLAN_LIMITS)
- activate/deactivatePremium nao expostos via REST (para uso interno/webhook futuro)
- Profile usa upsert (ON CONFLICT DO UPDATE) para simplificar criacao no login
- businessType enum: food, beauty, crafts, services, other
