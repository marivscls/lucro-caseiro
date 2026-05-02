# ai.context.mobile.md — Subscription (Mobile Feature)

---

## Purpose

Gerenciar perfil do usuario e assinatura: exibir/editar perfil (nome, negocio, telefone), consultar limites freemium, exibir banner de limite proximo/atingido e apresentar paywall para upgrade ao plano Premium.

## Non-goals

- Nao processa pagamento diretamente (paywall apenas direciona para acao de subscribe).
- Nao gerencia configuracoes do app (tema, notificacoes estao no Settings screen).
- Nao aplica enforcement de limites (feito no backend; front apenas consulta e exibe).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `UserProfile`, `UpdateProfile`, `FreemiumLimits`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** praticamente todas as features via hooks compartilhados:
  - `shared/hooks/use-limit-check` usa `useLimits()` para checar limites antes de criar recursos.
  - `shared/hooks/use-paywall` (Zustand store) controla visibilidade do paywall.
  - `tabs/index` (Home) usa `useProfile` e `LimitBanner`.
  - `app/settings.tsx` usa `useProfile` e `useUpdateProfile`.

## Code pointers

| Arquivo                                                             | Descricao                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/mobile/src/features/subscription/api.ts`                      | Funcoes HTTP (fetchProfile, updateProfile, fetchLimits) |
| `apps/mobile/src/features/subscription/hooks.ts`                    | React Query hooks                                       |
| `apps/mobile/src/features/subscription/components/limit-banner.tsx` | Banner de proximidade/atingimento de limite             |
| `apps/mobile/src/features/subscription/components/paywall.tsx`      | Tela completa de paywall Premium                        |
| `apps/mobile/src/shared/hooks/use-limit-check.ts`                   | Hook utilitario que usa `useLimits()` + `usePaywall`    |
| `apps/mobile/src/shared/hooks/use-paywall.ts`                       | Zustand store para controle de visibilidade do paywall  |
| `apps/mobile/src/app/settings.tsx`                                  | Screen de configuracoes (usa profile e updateProfile)   |

## Components

### `LimitBanner`

- **Props:** `{ resource: "sales" | "clients" | "recipes" | "packaging"; onUpgrade?: () => void }`
- Consulta `useLimits()` para obter current/max do recurso.
- Exibe banner apenas se >= 80% do limite (near limit) ou 100% (at limit).
- Barra de progresso visual com cores diferenciadas (premium bg para proximo, alert bg para atingido).
- Texto contextualizado: "Quase no limite" ou "Limite atingido!" com contagem atual/max.
- Pressable que chama `onUpgrade` (tipicamente abre paywall).

### `Paywall`

- **Props:** `{ title?, message?, currentUsage?, onSubscribe?, onClose? }`
- Tela full-screen com SafeAreaView.
- Icone de diamante, titulo customizavel, mensagem de uso atual.
- Card de upgrade urgente ("Quero ter limite ilimitado agora").
- Lista de beneficios Premium (8 itens com checkmarks).
- Card de preco: R$ 14,90/mes ou R$ 119,90/ano (33% economia).
- Botao "Assinar Premium" (variant premium) e link "Agora nao".
- Usa `@expo/vector-icons` (Ionicons).

## Hooks

| Hook                       | Tipo          | Descricao                                                                                |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `useProfile()`             | `useQuery`    | Perfil do usuario. Query key: `["subscription", "profile"]`                              |
| `useLimits()`              | `useQuery`    | Limites freemium atuais. Query key: `["subscription", "limits"]`                         |
| `useUpdateProfile()`       | `useMutation` | Atualiza perfil. Invalida `["subscription"]`.                                            |
| `useSubscription()`        | custom        | RevenueCat: `subscribe(period)`, `restore()`, `loading`. Sync silencioso no boot.        |
| `useMercadoPagoCheckout()` | custom        | Mercado Pago: `checkout(period)` chama API e abre URL no browser via `expo-web-browser`. |

### Hooks compartilhados

| Hook                      | Tipo          | Descricao                                                                                                             |
| ------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `useLimitCheck(resource)` | custom        | Retorna `{ isAtLimit, current, max, checkAndBlock }`. `checkAndBlock()` mostra paywall se no limite e retorna `true`. |
| `usePaywall`              | Zustand store | Estado global `{ visible, resource, show(resource), hide() }`.                                                        |

## API Integration

| Endpoint                                | Verbo | Funcao                      | Parametros                              |
| --------------------------------------- | ----- | --------------------------- | --------------------------------------- |
| `/api/v1/subscription/profile`          | GET   | `fetchProfile`              | -                                       |
| `/api/v1/subscription/profile`          | PATCH | `updateProfile`             | body: `UpdateProfile`                   |
| `/api/v1/subscription/limits`           | GET   | `fetchLimits`               | -                                       |
| `/api/v1/subscription/sync-plan`        | POST  | `syncPlan`                  | body: `{ plan, expiresAt }`             |
| `/api/v1/payments/mercadopago/checkout` | POST  | `createMercadoPagoCheckout` | body: `{ plan: "monthly" \| "annual" }` |

## Contracts

- `UserProfile` — perfil (name, businessName, businessType, phone, plan, createdAt).
- `UpdateProfile` — payload (name, businessName?, businessType?, phone?).
- `FreemiumLimits` — limites atuais (currentSalesThisMonth, maxSalesPerMonth, currentClients, maxClients, currentRecipes, maxRecipes, currentPackaging, maxPackaging).

## Error Handling

- **Erro de perfil:** tela Settings exibe loading spinner; fallback para dados default.
- **Erro de update:** `Alert.alert("Erro", "Nao foi possivel atualizar o perfil.")`.
- **Limites indisponiveis:** `LimitBanner` retorna null se `limits` for undefined.

## Performance

- `useLimits` e `useProfile` carregados uma vez e cacheados pelo React Query.
- `LimitBanner` renderiza condicionalmente (so aparece se >= 80% do limite).
- Paywall e componente leve (nenhuma chamada API, apenas UI).

## Test matrix

- [ ] `useLimits` retorna limites corretos
- [ ] `LimitBanner` nao aparece se < 80% do limite
- [ ] `LimitBanner` mostra "Limite atingido" se current >= max
- [ ] `LimitBanner` mostra "Quase no limite" se >= 80% e < 100%
- [ ] `useLimitCheck.checkAndBlock` retorna true e mostra paywall quando no limite
- [ ] `Paywall` exibe cada um dos beneficios
- [ ] `useUpdateProfile` invalida cache
- [ ] Settings screen edita e salva perfil

## Examples

- `LimitBanner` usado na Home para vendas: `<LimitBanner resource="sales" onUpgrade={() => showPaywall("sales")} />`.
- `useLimitCheck` usado em `CreateClientForm`, `CreateRecipeForm`, `NewSaleScreen`.
- Paywall aberto via `usePaywall.show(resource)`.
- Settings acessado via rota `/settings`.

## Change log / Decisions

- Preco do Premium: R$ 14,90/mes ou R$ 119,90/ano (hard-coded no front).
- Trial: 7 dias gratis em ambos os planos (configurado nas lojas e RevenueCat, nao no codigo).
- Dois planos expostos ao usuario (mensal + anual) — o paywall permite escolha.
- Integracao de pagamento via **RevenueCat** (`react-native-purchases`):
  - Entitlement unico: `premium`
  - Product IDs: `lucrocaseiro_premium_monthly` / `lucrocaseiro_premium_annual`
  - Offering: `default` (Current) com packages `$rc_monthly` e `$rc_annual`
  - API keys lidas de `Constants.expoConfig.extra.revenuecat` ({ iosKey, androidKey, entitlementId }) — campos vazios em `app.json`, preencher antes de build de producao
  - Sync backend via `POST /api/v1/subscription/sync-plan` apos compra/restore (client-side, otimista)
  - Webhook RevenueCat → `/api/v1/webhooks/revenuecat` e a fonte de verdade server-side
- `usePaywall` e Zustand store global para permitir abertura de qualquer lugar do app.
- Limites: sales 30/mes, clients 20, recipes 5, packaging 3 no plano Free.
- Setup completo das lojas + RevenueCat documentado em `docs/subscription-setup.md`.
- **Mercado Pago** adicionado como forma alternativa (PIX/cartao via web). Botao "Pagar com PIX ou cartao" aparece na paywall quando `onPayWithMercadoPago` e passado. Hook `useMercadoPagoCheckout` chama backend para gerar URL de checkout e abre no browser externo. Estado do plano e ativado via webhook server-side (`/api/v1/webhooks/mercadopago`), sem sync client-side.
