# Data Safety — Play Store Questionnaire

Respostas para cada pergunta do **Data Safety** do Play Console, baseadas no que o app **realmente** coleta. Cole na ordem.

> Acesso em **Play Console → App content → Data safety**.

## Etapa 1 — Data collection and security

**1.1 Does your app collect or share any of the required user data types?**

✅ **Yes**

**1.2 Is all of the user data collected by your app encrypted in transit?**

✅ **Yes** (todas as chamadas a API usam HTTPS/TLS)

**1.3 Do you provide a way for users to request that their data is deleted?**

✅ **Yes**

- URL: `https://orionseven.com.br/apps/lucro-caseiro/excluir-conta`

**1.4 Has your app been independently validated against a global security standard?**

❌ **No** (sem auditoria de seguranca formal por enquanto)

---

## Etapa 2 — Data types collected

Para cada tipo abaixo, marque **collected** e responda os 4 sub-campos:

- Collected? **Yes**
- Shared with third parties? (depende — ver abaixo)
- Processing: **Required (App can't function without it)** OU **Optional**
- Purposes: marque os que se aplicam

### 📍 Personal info

#### Name (Yes — required)

- Shared: **No**
- Optional/Required: **Required**
- Purposes: ✅ App functionality, ✅ Account management

#### Email address (Yes — required)

- Shared: **No**
- Required
- Purposes: ✅ App functionality, ✅ Account management

#### User IDs (Yes — required)

- Shared: **No**
- Required
- Purposes: ✅ App functionality, ✅ Account management

#### Address ❌ (nao coletamos)

#### Phone number (Yes — optional)

- Shared: **No**
- **Optional**
- Purposes: ✅ App functionality

#### Race and ethnicity ❌

#### Political or religious beliefs ❌

#### Sexual orientation ❌

#### Other info ❌

### 💰 Financial info

#### Purchase history (Yes — required, deriva de vendas registradas)

- Shared: **Yes** — com **Apple**, **Google** e **Mercado Pago** apenas para processar pagamento (assinaturas)
- Required
- Purposes: ✅ App functionality

#### User payment info ❌ (nao coletamos cartao — Apple/Google/MP fazem isso direto)

#### Credit info ❌

#### Other financial info (Yes — required: lancamentos do negocio do usuario)

- Shared: **No**
- Required
- Purposes: ✅ App functionality

> **Importante**: o "outros dados financeiros" e o financeiro DO NEGOCIO do usuario (entradas/saidas, vendas) — nao e o cartao de credito dele. Marque "App functionality" e nao compartilhe.

### 🏥 Health and fitness ❌ (nao se aplica)

### 💬 Messages ❌

### 📷 Photos and videos

#### Photos (Yes — optional)

- Shared: **No**
- **Optional**
- Purposes: ✅ App functionality
- Detalhe: usuario opcionalmente envia foto pra produtos e receitas. Armazenadas em storage privado da conta.

#### Videos ❌

### 🎵 Audio files ❌

### 📁 Files and docs ❌

### 📅 Calendar ❌

### 👤 Contacts ❌

### 📍 Location ❌

### 🌐 Web browsing ❌

### 📱 App activity

#### App interactions ❌ (nao coletamos analytics de interacao)

#### In-app search history ❌

#### Installed apps ❌

#### Other user-generated content (Yes — required: clientes, produtos, receitas, etiquetas)

- Shared: **No**
- Required
- Purposes: ✅ App functionality
- Detalhe: cadastros do usuario (clientes, produtos, etc) — nao expostos publicamente.

#### Other actions ❌

### 🐛 App info and performance

#### Crash logs (Yes — optional)

- Shared: **No** (ou Yes com "Service providers" se usar Sentry/etc — por enquanto nao)
- Optional
- Purposes: ✅ App functionality, ✅ Analytics

#### Diagnostics ❌

#### Other app performance ❌

### 📡 Device or other IDs

#### Device or other IDs (Yes — required, para push notifications)

- Shared: **No**
- Required
- Purposes: ✅ App functionality (notificacoes push)

---

## Etapa 3 — Review

Confira o resumo gerado pelo Play Console — deve mostrar:

**Data shared**: Purchase history (com Apple, Google e Mercado Pago)

**Data collected**:

- Name, Email, Phone (opcional), User IDs
- Purchase history, Other financial info
- Photos (opcional)
- Other user-generated content
- Crash logs (opcional)
- Device or other IDs

**Security practices**:

- Encrypted in transit ✅
- Users can request data deletion ✅

Confirme e publique.

---

## Quando atualizar

Update este formulario sempre que:

- Adicionar/remover um SDK que coleta dados (Sentry, AdMob, etc)
- Adicionar coleta de novos campos (ex: localizacao, contatos)
- Mudar com quem dados sao compartilhados
- Trocar provedor de pagamento
