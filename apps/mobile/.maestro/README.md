# Testes E2E (Maestro)

Testes end-to-end do app mobile usando [Maestro](https://maestro.dev) — navegação real
entre as telas em um emulador Android. Escolhemos **Maestro** (e não Detox) por ser
_black-box_, sem build instrumentado, com flows em YAML simples.

## Estrutura

```
.maestro/
  config.yaml            # define a suíte (flows/*.yaml) e a ordem
  flows/
    01-smoke.yaml        # app abre e renderiza (NÃO precisa de credenciais)
    02-login.yaml        # login com e-mail/senha -> home
    03-tabs-navigation.yaml  # navega Início / Vendas / Clientes / Mais
    04-more-navigation.yaml  # abre telas do menu "Mais" (Produtos, Financeiro, Receitas)
  subflows/
    login.yaml           # passos de login (reutilizável)
    open-app.yaml        # abre o app (via Metro) + loga se necessário + garante a home
  run.mjs                # runner: injeta credenciais (.env) nos flows via -e
  .env.example           # modelo de credenciais (copie p/ .env)
  screenshots/           # saída de takeScreenshot (gitignored)
```

## Pré-requisitos (já configurados nesta máquina)

- **Android SDK** em `%LOCALAPPDATA%\Android\Sdk` (`ANDROID_HOME` no escopo do usuário).
- **JDK 21** do Android Studio (`JAVA_HOME` = `C:\Program Files\Android\Android Studio1\jbr`).
- **Maestro** em `%USERPROFILE%\maestro` (no PATH do usuário).
- **AVD** `lucro_e2e` (Pixel 7, Android 35, x86_64).

> Variáveis gravadas no escopo **User**. Se `maestro`/`adb` não forem reconhecidos,
> **abra um terminal novo** (o PATH só atualiza em processos abertos depois).

## Como o app roda nos testes (dev client + Metro)

> ⚠️ O build **nativo local** (`expo run:android`) está bloqueado neste Windows por
> **MAX_PATH (260)** com o pnpm. E o build **EAS preview/release** falha na resolução de
> variantes (`No variants exist` p/ os módulos RN). Por isso usamos o build **EAS
> `development`** (dev client), que carrega o JS do **Metro local**.

Como o dev client carrega o JS do Metro, os flows **não** usam `launchApp`/`clearState`
(cairia no menu do expo-dev-client e apagaria a URL do Metro). Em vez disso abrem o app
via **deep link** apontando pro Metro na porta **8083**:

```
lucrocaseiro://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8083
```

### Passo a passo

1. **Subir o emulador**

   ```powershell
   emulator -avd lucro_e2e -no-boot-anim
   adb wait-for-device; adb shell getprop sys.boot_completed   # -> 1
   ```

2. **Instalar o dev client** (uma vez por build). Logado no EAS como **`marivscls5`**
   (dono do projeto), gere e instale:

   ```powershell
   eas build --platform android --profile development
   # baixe o .apk (URL no fim do build) e instale:
   adb install -r caminho/do/app.apk
   ```

3. **Subir o Metro na porta 8083** (o JS é servido daqui; roda local sem problema):

   ```powershell
   cd apps/mobile
   pnpm exec expo start --dev-client --port 8083
   adb reverse tcp:8083 tcp:8083
   ```

4. **Credenciais de login** — copie o modelo e preencha:

   ```powershell
   cd apps/mobile/.maestro
   cp .env.example .env     # preencha E2E_PASSWORD
   ```

   Use uma conta de **teste** que tenha login por **e-mail/senha** (contas só-Google não
   funcionam aqui). O `.env` é gitignored.

5. **Rodar**
   ```powershell
   cd apps/mobile
   pnpm e2e:smoke          # só o smoke (não precisa de senha)
   pnpm e2e                # suíte inteira (flows/*.yaml em ordem)
   node .maestro/run.mjs flows/03-tabs-navigation.yaml   # um flow específico
   ```

### Maestro Studio (inspecionar a tela / montar flows)

```powershell
cd apps/mobile
pnpm e2e:studio
```

## Escrevendo novos flows (e armadilhas do dev client)

- O app **não usa `testID`** — seletores batem em **texto visível em PT** (labels,
  títulos, placeholders) e `accessibilityLabel`. Ex.: `tapOn: "Vendas"`.
- Texto é **regex**. Pra casar exato, ancore: `text: "^Entrar$"` (evita "Entrar com Google").
- **Não use `hideKeyboard`** na tela de login: ele manda `Back` e SAI do app. Para
  dispensar o teclado, dê `tapOn` num texto neutro (ex.: o título "Que bom te ver!").
- **Abas (tab bar) são tocadas por COORDENADA**, não pelo rótulo: o texto do rótulo fica
  na faixa de gesto do sistema (~94% no Pixel 7) e não registra o toque. Use o ícone:
  `tapOn: { point: "30%,94%" }` (centros x: Início 10%, Vendas 30%, (+) 50%, Clientes 70%, Mais 90%).
- **LogBox do IAP**: no emulador o `react-native-iap` falha (sem Google Play billing) e o
  LogBox reaparece sobre a tab bar, interceptando toques. Os flows 03/04 envolvem cada
  toque de aba num `repeat` que fecha o "Dismiss" e re-toca até chegar no destino.
- **Listas longas**: itens fora da tela precisam de `scrollUntilVisible` (ex.: "Receitas"
  no menu "Mais"). Depois de rolar, role de volta (`direction: UP`) pra reassertar o topo.
- Login + rede demoram: prefira `extendedWaitUntil` com `timeout` generoso.
- Telas empilhadas (Produtos, Financeiro, etc.) têm header próprio em
  [src/app/\_layout.tsx](../src/app/_layout.tsx) — bons âncoras de assert.
- `assertVisible` **não aceita** `timeout` (use `extendedWaitUntil`); `optional` também não.

## Cobertura atual (20 flows verdes)

Navegação (01–04): smoke, login, abas, menu "Mais".
Funcionais (testados no emulador, geram dado real na conta free):
05 produto · 06 cliente · 07 insumo · 08 receita (categoria modal + ingrediente + unidade) ·
09 venda (4 steps + fecha anúncio AdMob) · 10 financeiro · 11 encomenda · 12 orçamento ·
13 embalagem (+ valida limite freemium) · 14 rótulo · 15 precificação (wizard 5 etapas) ·
16 catálogo · 17 editar perfil · 18 ações de venda (cancelar) ·
19 fiado (registra venda fiado → aparece no Fiado → "Recebi") · 20 insights.

**Bug encontrado e corrigido pelo E2E:** o flow 19 expôs que vendas com pagamento "Fiado"
(`credit`) nasciam como `"paid"` (default do schema) em vez de `"pending"`, então **nunca
apareciam na tela Fiado**. Corrigido em `fix(sales): credit (fiado) sales start as pending`
(`initialSaleStatus` no domínio da API) e **verificado na tela** — a dívida aparece no Fiado
e o "Recebi" funciona.

App: o filtro dev-only do LogBox-IAP em [src/app/\_layout.tsx](../src/app/_layout.tsx) é
necessário (senão o overlay vermelho do IAP trava a UI no emulador).

Requer emulador + Metro (8083) no ar e `E2E_PASSWORD` em `.maestro/.env`.
