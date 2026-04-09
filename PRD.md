# PRD — Lucro Caseiro

## Visao Geral

**Lucro Caseiro** e um app de gestao completa para negocios caseiros: confeitaria, docinhos, chup chup, marmitas, manicure, sobrancelha, artesanato, bolos e qualquer atividade de renda feita em casa.

O objetivo e ser a ferramenta mais simples e completa do mercado para quem empreende de casa, permitindo controlar vendas, clientes, financas, receitas, precificacao e embalagens/rotulos — tudo em um so lugar.

### Publico-alvo

- Empreendedores caseiros de qualquer idade (15-70+ anos)
- Pessoas com pouco ou nenhum conhecimento tecnico
- Microempreendedores individuais (MEI) e informais
- Nichos: alimentacao caseira, beleza/estetica, artesanato, servicos domesticos

### Principios de UX

- **Simplicidade radical**: maximo 3 toques pra qualquer acao principal
- **Linguagem humana**: zero jargoes tecnicos ("Quanto voce lucrou" em vez de "Margem liquida")
- **Tipografia grande**: fontes minimas de 16px, botoes de toque minimo 48x48dp
- **Cores claras e contraste alto**: acessibilidade WCAG AA minimo
- **Onboarding guiado**: tutorial interativo no primeiro uso
- **Feedback visual imediato**: animacoes suaves, confirmacoes claras
- **Modo escuro opcional**: para conforto visual

---

## Plataformas

| Plataforma | Tecnologia                     |
| ---------- | ------------------------------ |
| iOS        | Expo (React Native)            |
| Android    | Expo (React Native)            |
| Web        | Expo Router (react-native-web) |
| API        | Express.js + Supabase          |

**Codebase unica** para todas as plataformas via Expo Router.

---

## Monetizacao

### Plano Gratuito (Freemium)

- Ate **30 vendas/mes**
- Ate **20 clientes**
- Ate **5 receitas**
- Calculadora de precificacao (sem salvar historico)
- Relatorio financeiro basico (mensal)
- 1 modelo de rotulo

### Plano Premium (Assinatura)

- Vendas **ilimitadas**
- Clientes **ilimitados**
- Receitas **ilimitadas**
- Calculadora com historico e comparacao
- Relatorios completos (diario, semanal, mensal, anual + graficos)
- Rotulos/embalagens ilimitados + templates premium
- Exportar PDF/Excel
- Backup automatico
- Suporte prioritario

**Precos sugeridos** (validar com pesquisa):

- Mensal: R$ 14,90
- Anual: R$ 119,90 (desconto ~33%)

**Pagamento**: Stripe (web) + In-App Purchase (iOS/Android)

---

## Modulos

### 1. Vendas

**Objetivo**: Registrar vendas de forma rapida e intuitiva.

#### Funcionalidades

- **Registro rapido de venda**: selecionar produto(s), quantidade, cliente (opcional), forma de pagamento
- **Formas de pagamento**: Pix, dinheiro, cartao, fiado, transferencia
- **Status da venda**: pendente, paga, cancelada
- **Historico de vendas**: listagem com filtros (data, cliente, produto, status)
- **Venda fiado**: controle de dividas por cliente, marcar como pago parcial/total
- **Resumo do dia**: total vendido, quantidade de vendas, ticket medio
- **Venda recorrente**: agendar entregas recorrentes (ex: marmita toda segunda)

#### Telas

- Home (dashboard com resumo do dia)
- Nova Venda (wizard simples: produto -> quantidade -> cliente -> pagamento -> confirmar)
- Lista de Vendas (com filtros e busca)
- Detalhe da Venda
- Vendas Fiado (lista de devedores)

#### Limites Freemium

- 30 vendas/mes
- Sem exportacao

---

### 2. Carteira de Clientes

**Objetivo**: Manter relacionamento com clientes e conhecer seus habitos.

#### Funcionalidades

- **Cadastro simples**: nome, telefone (WhatsApp), endereco (opcional), observacoes
- **Historico de compras**: tudo que o cliente ja comprou, total gasto
- **Contato rapido**: botao direto pro WhatsApp com mensagem pre-formatada
- **Aniversario**: lembrete de aniversario do cliente
- **Tags/categorias**: VIP, frequente, novo, etc.
- **Busca rapida**: por nome ou telefone

#### Telas

- Lista de Clientes (busca + filtros)
- Perfil do Cliente (historico, total gasto, observacoes)
- Novo/Editar Cliente
- Aniversariantes do mes

#### Limites Freemium

- 20 clientes
- Sem tags/categorias

---

### 3. Controle Financeiro

**Objetivo**: Saber exatamente quanto entra, quanto sai e quanto sobra.

#### Funcionalidades

- **Entradas automaticas**: vendas alimentam automaticamente
- **Entradas manuais**: outros ganhos (ex: frete cobrado, gorjeta)
- **Saidas/despesas**: ingredientes, materiais, embalagens, gas, luz, transporte
- **Categorias de despesa**: material, embalagem, transporte, taxa, outros
- **Saldo atual**: visao clara do caixa
- **Relatorio mensal**: entradas vs saidas, lucro liquido
- **Relatorio por periodo**: escolher datas
- **Graficos simples**: barras ou pizza mostrando de onde vem e pra onde vai o dinheiro
- **Exportar PDF/Excel** (premium)

#### Telas

- Painel Financeiro (saldo, entradas, saidas do mes)
- Nova Entrada/Saida
- Historico (lista com filtros)
- Relatorios (graficos)

#### Limites Freemium

- Relatorio mensal basico apenas
- Sem exportacao
- Sem graficos detalhados

---

### 4. Receitas

**Objetivo**: Organizar receitas com controle de ingredientes e rendimento.

#### Funcionalidades

- **Cadastro de receita**: nome, categoria, ingredientes com quantidades, modo de preparo
- **Rendimento**: quantas unidades/porcoes a receita faz
- **Custo automatico**: calcula custo total da receita baseado nos precos dos ingredientes
- **Custo por unidade**: custo total / rendimento
- **Ingredientes salvos**: banco de ingredientes com precos atualizaveis
- **Categorias**: doces, salgados, bolos, bebidas, etc.
- **Foto da receita** (opcional)
- **Duplicar receita**: pra criar variacoes
- **Escalar receita**: multiplicar/dividir quantidades automaticamente

#### Telas

- Lista de Receitas (por categoria)
- Nova/Editar Receita
- Detalhe da Receita (ingredientes, custo, rendimento)
- Banco de Ingredientes
- Escalar Receita (slider de multiplicador)

#### Limites Freemium

- 5 receitas
- Sem foto
- Sem escalar

---

### 5. Calculadora de Precificacao

**Objetivo**: Ajudar a definir o preco justo de venda com base em custos reais.

#### Funcionalidades

- **Custo dos ingredientes/materiais**: puxa da receita ou insere manual
- **Custo de embalagem**: seleciona embalagem cadastrada ou insere valor
- **Mao de obra**: tempo gasto x valor da hora (calculado ou fixo)
- **Custos fixos rateados**: aluguel, luz, gas, internet — rateio por unidade produzida
- **Margem de lucro desejada**: slider de % (ex: 50%, 100%, 200%)
- **Preco sugerido**: calculado automaticamente
- **Comparacao**: "Se voce vender a R$ X, seu lucro por unidade e R$ Y"
- **Historico de precificacoes** (premium): salvar e comparar ao longo do tempo
- **Simulador**: "E se eu aumentar a margem pra 80%?" — ve o impacto em tempo real

#### Telas

- Calculadora (formulario step-by-step)
- Resultado (preco sugerido + breakdown visual)
- Historico (premium)

#### Limites Freemium

- Pode usar a calculadora, mas nao salva historico
- Sem comparacao temporal

---

### 6. Embalagens e Rotulos

**Objetivo**: Vincular embalagens e rotulos aos produtos para organizacao e impressao.

#### Funcionalidades

- **Cadastro de embalagem**: nome, tipo (caixa, saco, pote, filme), custo unitario, fornecedor (opcional), foto
- **Vincular embalagem ao produto**: cada produto pode ter 1+ embalagens associadas
- **Rotulos**: editor simples de rotulo com:
  - Nome do produto
  - Ingredientes (puxa da receita)
  - Data de fabricacao/validade
  - Informacoes do produtor (nome, telefone, endereco)
  - Logo/marca (upload)
  - QR code opcional (link pro WhatsApp ou Instagram)
- **Templates de rotulo**: modelos prontos por categoria (doce, salgado, cosmtico, artesanato)
- **Gerar PDF para impressao**: formato A4 com multiplos rotulos (ex: 12 por pagina)
- **Historico de impressoes**

#### Telas

- Lista de Embalagens
- Nova/Editar Embalagem
- Editor de Rotulo (WYSIWYG simplificado)
- Selecao de Template
- Preview de Impressao
- Vincular ao Produto

#### Limites Freemium

- 1 template de rotulo
- Sem logo/QR code
- Maximo 3 embalagens cadastradas

---

## Modulo Transversal: Produtos

**Objetivo**: Catalogo central que conecta todos os modulos.

#### Funcionalidades

- **Cadastro de produto**: nome, descricao, categoria, foto, preco de venda
- **Vinculo com receita**: um produto pode ter uma receita associada (custo auto)
- **Vinculo com embalagem**: uma ou mais embalagens
- **Vinculo com rotulo**: modelo de rotulo associado
- **Estoque simples** (opcional): quantidade em maos, alerta de estoque baixo
- **Categorias customizaveis**: doces, salgados, bolos, artesanato, servicos, etc.

#### Telas

- Catalogo de Produtos (grid visual com fotos)
- Novo/Editar Produto
- Detalhe do Produto (links pra receita, embalagem, rotulo, historico de vendas)

---

## Modulo Transversal: Dashboard / Home

**Objetivo**: Visao rapida do negocio ao abrir o app.

#### Cards principais

- **Vendas de hoje**: total em R$ + quantidade
- **Semana/Mes**: comparativo simples
- **Fiado pendente**: total a receber
- **Proximo aniversario**: cliente(s) fazendo aniversario
- **Acoes rapidas**: Nova Venda, Novo Cliente, Calculadora (botoes grandes)

---

## Arquitetura Tecnica

### Stack

| Camada             | Tecnologia                                    |
| ------------------ | --------------------------------------------- |
| Mobile + Web       | Expo Router (React Native + react-native-web) |
| Estilizacao        | NativeWind (Tailwind para React Native)       |
| Estado             | Zustand + React Query                         |
| Backend            | Express.js                                    |
| Banco de dados     | Supabase (PostgreSQL)                         |
| Auth               | Supabase Auth (email + Google + Apple)        |
| Storage            | Supabase Storage (fotos, logos, rotulos)      |
| Pagamento          | Stripe (web) + RevenueCat (iOS/Android IAP)   |
| PDF                | react-native-pdf-lib ou expo-print            |
| Push notifications | Expo Notifications                            |

### Monorepo (mesmo padrao Lunoa)

```
lucro-caseiro/
├── apps/
│   ├── mobile/              # Expo Router (iOS + Android + Web)
│   │   └── src/
│   │       ├── app/         # File-based routing
│   │       ├── features/    # Vertical slices
│   │       │   ├── sales/
│   │       │   ├── clients/
│   │       │   ├── finance/
│   │       │   ├── recipes/
│   │       │   ├── pricing/
│   │       │   ├── packaging/
│   │       │   ├── products/
│   │       │   └── subscription/
│   │       └── shared/
│   └── api/                 # Express.js
│       └── src/
│           ├── features/    # Vertical slices (API)
│           │   ├── sales/
│           │   ├── clients/
│           │   ├── finance/
│           │   ├── recipes/
│           │   ├── pricing/
│           │   ├── packaging/
│           │   ├── products/
│           │   └── subscription/
│           └── shared/
├── packages/
│   ├── database/            # Drizzle + Supabase schema
│   ├── contracts/           # Zod schemas compartilhados
│   ├── ui/                  # Design system (NativeWind)
│   └── config/              # ESLint, TSConfig, Prettier
├── docs/
│   └── ai-context-template.md
├── scripts/                 # context-lint, etc.
├── .husky/
├── .github/workflows/
├── CLAUDE.md
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Modelo de Dados (Supabase/PostgreSQL)

```
users
├── id (uuid, PK)
├── email
├── name
├── phone
├── business_name
├── business_type (enum: food, beauty, crafts, services, other)
├── plan (enum: free, premium)
├── plan_expires_at
├── created_at

products
├── id (uuid, PK)
├── user_id (FK -> users)
├── name
├── description
├── category
├── photo_url
├── sale_price (decimal)
├── cost_price (decimal, calculado)
├── recipe_id (FK -> recipes, nullable)
├── stock_quantity (int, nullable)
├── stock_alert_threshold (int, nullable)
├── is_active (boolean)
├── created_at

clients
├── id (uuid, PK)
├── user_id (FK -> users)
├── name
├── phone
├── address
├── birthday (date, nullable)
├── notes
├── tags (text[])
├── total_spent (decimal, computed)
├── created_at

sales
├── id (uuid, PK)
├── user_id (FK -> users)
├── client_id (FK -> clients, nullable)
├── status (enum: pending, paid, cancelled)
├── payment_method (enum: pix, cash, card, credit, transfer)
├── total (decimal)
├── notes
├── sold_at (timestamp)
├── created_at

sale_items
├── id (uuid, PK)
├── sale_id (FK -> sales)
├── product_id (FK -> products)
├── quantity (int)
├── unit_price (decimal)
├── subtotal (decimal)

finance_entries
├── id (uuid, PK)
├── user_id (FK -> users)
├── type (enum: income, expense)
├── category (enum: sale, material, packaging, transport, fee, utility, other)
├── amount (decimal)
├── description
├── sale_id (FK -> sales, nullable — auto-link)
├── date (date)
├── created_at

recipes
├── id (uuid, PK)
├── user_id (FK -> users)
├── name
├── category
├── instructions (text)
├── yield_quantity (int)
├── yield_unit (text — "unidades", "porcoes", "fatias")
├── photo_url (nullable)
├── total_cost (decimal, computed)
├── cost_per_unit (decimal, computed)
├── created_at

recipe_ingredients
├── id (uuid, PK)
├── recipe_id (FK -> recipes)
├── ingredient_id (FK -> ingredients)
├── quantity (decimal)
├── unit (text — "g", "ml", "un", "kg", "L")

ingredients
├── id (uuid, PK)
├── user_id (FK -> users)
├── name
├── price (decimal)
├── quantity_per_package (decimal)
├── unit (text)
├── supplier (text, nullable)
├── updated_at

pricing_calculations
├── id (uuid, PK)
├── user_id (FK -> users)
├── product_id (FK -> products, nullable)
├── ingredient_cost (decimal)
├── packaging_cost (decimal)
├── labor_cost (decimal)
├── fixed_cost_share (decimal)
├── total_cost (decimal)
├── margin_percent (decimal)
├── suggested_price (decimal)
├── created_at

packaging
├── id (uuid, PK)
├── user_id (FK -> users)
├── name
├── type (enum: box, bag, pot, film, label, other)
├── unit_cost (decimal)
├── supplier (text, nullable)
├── photo_url (nullable)
├── created_at

product_packaging
├── product_id (FK -> products)
├── packaging_id (FK -> packaging)

labels
├── id (uuid, PK)
├── user_id (FK -> users)
├── product_id (FK -> products, nullable)
├── template_id (text)
├── name
├── data (jsonb — conteudo do rotulo: ingredientes, validade, etc.)
├── logo_url (nullable)
├── qr_code_url (nullable)
├── created_at

recurring_sales
├── id (uuid, PK)
├── user_id (FK -> users)
├── client_id (FK -> clients)
├── product_id (FK -> products)
├── quantity (int)
├── frequency (enum: daily, weekly, biweekly, monthly)
├── next_date (date)
├── is_active (boolean)
├── created_at
```

### Indices Importantes

```sql
-- User-scoped (toda query)
CREATE INDEX idx_products_user ON products(user_id);
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_user_date ON sales(user_id, sold_at DESC);
CREATE INDEX idx_finance_user_date ON finance_entries(user_id, date DESC);
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_ingredients_user ON ingredients(user_id);
CREATE INDEX idx_packaging_user ON packaging(user_id);
CREATE INDEX idx_labels_user ON labels(user_id);

-- Busca
CREATE INDEX idx_clients_user_phone ON clients(user_id, phone);
CREATE INDEX idx_products_user_name ON products(user_id, name);

-- Financeiro
CREATE INDEX idx_finance_user_type_date ON finance_entries(user_id, type, date DESC);

-- Fiado
CREATE INDEX idx_sales_user_status ON sales(user_id, status) WHERE status = 'pending';
```

### RLS (Row Level Security)

Todas as tabelas com `user_id` terao RLS habilitado:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_products" ON products
  FOR ALL USING (user_id = auth.uid());
-- Repetir para todas as tabelas
```

---

## Navegacao do App

### Tab Bar (navegacao principal)

```
[ Home ]  [ Vendas ]  [ + ]  [ Clientes ]  [ Mais ]
```

- **Home**: Dashboard com resumo
- **Vendas**: Historico + filtros
- **+** (botao central grande): Nova Venda (acao principal)
- **Clientes**: Lista de clientes
- **Mais**: Financeiro, Receitas, Produtos, Precificacao, Embalagens, Configuracoes

### Fluxo de Nova Venda (exemplo)

```
1. Toca no "+" central
2. Seleciona produto(s) — grid visual com fotos
3. Define quantidade (botoes + e -)
4. Seleciona cliente (opcional, busca rapida)
5. Escolhe forma de pagamento (icones grandes)
6. Confirma — animacao de sucesso
```

**Total de toques: 5-6** (meta: sempre < 7 toques)

---

## Acessibilidade e Inclusao

### Design para todos

- **Fontes**: minimo 16px body, 20px titulos, 24px numeros importantes
- **Botoes**: minimo 48x48dp area de toque, 56dp para acoes principais
- **Icones**: sempre acompanhados de texto (nunca so icone)
- **Cores**: contraste minimo 4.5:1 (WCAG AA)
- **Linguagem**: "Quanto voce ganhou hoje" (nao "Revenue"), "Seus clientes" (nao "CRM")
- **Numeros**: sempre formatados em Real brasileiro (R$ 1.234,56)
- **Feedback tatil**: haptic feedback em acoes importantes (iOS)
- **Modo alto contraste**: opcao nas configuracoes

### Onboarding

1. "Bem-vindo! O que voce faz?" (selecao de categoria com ilustracoes)
2. "Cadastre seu primeiro produto" (guiado)
3. "Registre sua primeira venda" (simulacao)
4. "Pronto! Seu negocio ta organizado"

---

## Notificacoes

- **Lembrete de aniversario de cliente**: 1 dia antes
- **Estoque baixo**: quando atingir o limite
- **Venda recorrente**: lembrete no dia
- **Fiado vencido**: X dias sem pagamento
- **Resumo semanal**: "Voce vendeu R$ X essa semana! Lucro de R$ Y"

---

## Configuracoes

- **Perfil do negocio**: nome, tipo, logo, endereco, telefone
- **Moeda**: BRL (padrao), expansivel
- **Tema**: claro, escuro, automatico
- **Notificacoes**: ligar/desligar por tipo
- **Backup**: exportar dados (premium)
- **Assinatura**: gerenciar plano
- **Sobre / Ajuda / Contato**

---

## Metricas de Sucesso

| Metrica                   | Meta                  |
| ------------------------- | --------------------- |
| Onboarding completion     | > 70%                 |
| DAU/MAU ratio             | > 30%                 |
| Primeira venda registrada | < 5 min apos cadastro |
| Conversao free -> premium | > 5%                  |
| Retencao D30              | > 40%                 |
| NPS                       | > 50                  |
| Avaliacao nas stores      | > 4.5 estrelas        |

---

## Roadmap de Implementacao

### Fase 1 — Fundacao (Semanas 1-2)

- [ ] Setup monorepo (Expo + Express + packages)
- [ ] Tooling completo (ESLint, Prettier, Husky, Sherif, Knip, Commitlint)
- [ ] CLAUDE.md + ai.context templates
- [ ] Supabase setup (auth, database, storage)
- [ ] Schema inicial (migrations)
- [ ] Design system base (NativeWind + componentes core)
- [ ] Navegacao principal (tab bar + stack)
- [ ] Auth flow (cadastro, login, logout)

### Fase 2 — Core (Semanas 3-5)

- [ ] Modulo Produtos (CRUD + catalogo visual)
- [ ] Modulo Clientes (CRUD + busca + WhatsApp)
- [ ] Modulo Vendas (registro rapido + historico + fiado)
- [ ] Dashboard / Home (resumo do dia)
- [ ] Controle Financeiro (entradas/saidas + relatorios basicos)

### Fase 3 — Avancado (Semanas 6-8)

- [ ] Modulo Receitas (CRUD + ingredientes + custo)
- [ ] Banco de Ingredientes
- [ ] Calculadora de Precificacao
- [ ] Modulo Embalagens (CRUD + vincular a produto)
- [ ] Editor de Rotulos + Templates
- [ ] Geracao de PDF pra impressao

### Fase 4 — Monetizacao e Polish (Semanas 9-10)

- [ ] Sistema de assinatura (Stripe + RevenueCat)
- [ ] Limites freemium (enforcement)
- [ ] Paywall screens
- [ ] Notificacoes push
- [ ] Vendas recorrentes
- [ ] Exportacao PDF/Excel
- [ ] Onboarding guiado
- [ ] Testes E2E
- [ ] Performance e otimizacao
- [ ] Preparar para stores (App Store + Play Store)
