# ADR/PRD 0002 — Regras de Validação por Tela (QA)

> **Tipo:** ADR (decisão) + PRD (especificação de regras de validação)
> **Status:** Proposto · **Data:** 2026-05-30 · **Escopo:** `apps/mobile` (client), `apps/api` (usecases/domain), `packages/contracts` (Zod)
> **Relacionado:** [ADR 0001 — Plano de Testes das Telas](./0001-plano-de-testes-telas.md)
> **Objetivo:** Catalogar, por tela, as validações **atuais** e as **regras adicionais** recomendadas (auditoria de QA), para o público leigo não inserir dados inválidos/absurdos e o backend não aceitar lixo.

---

## 1. Contexto

Auditoria de QA tela a tela (formulários do app + Zod dos contratos + `*.domain.ts`/`*.usecases.ts`). O app valida em duas camadas (client p/ UX, server p/ segurança), mas faltam regras de **negócio/plausibilidade** e **limites numéricos**, e alguns **limites freemium só existem no client** (contornáveis via API).

## 2. Decisão

Adotar as **regras transversais (§4)** como padrão obrigatório e tratar a **matriz por tela (§5)** como backlog de QA, priorizado em **P0 (antes de produção) / P1 / P2**. Toda regra nova de validação deve existir no **contrato Zod** (fonte da verdade) e, quando for regra de negócio, também no `*.domain.ts`; o client só projeta a mensagem amigável.

## 3. Convenção de mensagens

- Linguagem simples, PT-BR, dizendo **o que fazer** ("Use DD/MM/AAAA", "O valor precisa ser maior que zero").
- Limites numéricos com mensagem clara ("Valor muito alto — confira").
- Nunca mostrar erro cru do Zod/Supabase ao usuário (traduzir).

---

## 4. Regras TRANSVERSAIS (valem para várias telas)

### 4.1 Limites numéricos (anti-absurdo / anti-overflow) — **P1**

- Todo campo de **dinheiro** (`salePrice`, `unitPrice`, `amount`, `unitCost`, `costPerUnit`, custos de precificação, meta de pró-labore) deve ter **máximo** (sugestão: `≤ 9.999.999,99`) além do mínimo já existente.
- Toda **quantidade** (itens de venda, estoque, rendimento, ingrediente) deve ter **máximo** sensato (ex: `≤ 1.000.000`) e ser inteiro onde aplica.
- Garante 2 casas decimais em dinheiro.

### 4.2 Datas plausíveis e coerentes — **P1** (parte já feita)

- ✅ **Feito:** rejeita data incompleta e ano implausível (1900–2100) via `brToIso` compartilhado (rótulos, clientes, encomendas).
- ⚠️ **A fazer (regra de negócio):**
  - **Validade ≥ Fabricação** no rótulo (hoje não é checado).
  - **Encomenda:** data de entrega **não pode ser no passado** (avisar; permitir hoje em diante).
  - **Financeiro:** lançamento **não pode ser no futuro**.
  - **Aniversário do cliente:** **não pode ser no futuro**.

### 4.3 Limites freemium enforçados no **backend** — **P0**

- Hoje o bloqueio de `sales` (30/mês), `clients` (20), `recipes` (5), `packaging` (3) é só no client (`useLimitCheck`). Uma chamada direta à API **ignora** o limite.
- **Regra:** validar o limite no `*.usecases.ts` antes de `create()` (já existe `subscription.domain` com os limites; falta aplicar nos usecases de cada recurso).
- **Gap de client:** `CreatePackagingForm` **não** chama `useLimitCheck("packaging")` (os outros chamam). Adicionar.

### 4.4 Telefone padronizado — **P2** (parte já feita)

- ✅ Cliente (criar/editar) e Configurações usam `maskPhoneBR` + `isValidBrazilPhone`.
- ⚠️ **Rótulo → "telefone do produtor"** tem máscara mas **sem validação** de dígitos. Aplicar `isValidBrazilPhone` (se preenchido).

### 4.5 Tamanho máximo de texto livre — **P2**

- Campos sem limite no client devem respeitar o do contrato e avisar (não truncar em silêncio). Auditar: `ingredients`, `producerAddress`, `notes/observações`, `address`, `tags` (máx 10).
- Onde o contrato **não** tem limite, adicionar (ex: rótulo `ingredients` `≤ 2000`, `producerAddress` `≤ 500`, campos de nutrição `≤ 100` cada).

### 4.6 Unicidade (opcional) — **P2**

- Sem checagem de **nome duplicado** por usuário (produto/cliente/insumo/receita). Avaliar avisar "já existe um com esse nome".

---

## 5. Matriz POR TELA (atual → recomendado)

> Legenda prioridade: **P0** crítico · **P1** importante · **P2** melhoria. ✅ já implementado.

### 5.1 Nova venda — `tabs/new-sale.tsx` / `sales`

- **Atual:** carrinho ≥ 1 item; forma de pagamento obrigatória; `useLimitCheck("sales")`; backend `quantity>0`, `unitPrice>0`, checa estoque; `notes ≤ 500`.
- **Recomendado:**
  - **P0** Enforçar limite de 30 vendas/mês no **backend**.
  - **P1** `unitPrice` e `quantity` com **máximo** (§4.1).
  - **P1** `soldAt` plausível (não futuro distante / passado absurdo).
  - **P2** Mensagem de limite específica ("30/30 vendas do plano grátis este mês").
  - **P2** Validar `dateFrom ≤ dateTo` e formato nas queries de listagem.

### 5.2 Encomenda — `features/orders/components/order-form.tsx`

- **Atual:** título obrigatório (≤200); data DD/MM/AAAA válida (✅ plausível); hora `HH:MM`; `amount` opcional; `notes ≤ 500`.
- **Recomendado:**
  - **P1** `amount` **> 0** se preenchido (contrato hoje é `min(0)` → aceita zero).
  - **P1** Data de entrega **não no passado** (avisar).
  - **P2** Não permitir **hora sem data**.
  - **P2** Avaliar limite freemium p/ encomendas (hoje não existe).

### 5.3 Clientes — `features/clients/components/{create,edit}-client-form.tsx`

- **Atual:** nome obrigatório (≤200); ✅ telefone mascarado+validado; ✅ aniversário DD/MM/AAAA válido; `notes ≤ 2000`; `tags` ≤10×50 (server); `useLimitCheck("clients")`.
- **Recomendado:**
  - **P0** Enforçar limite de 20 clientes no **backend**.
  - **P1** Aniversário **não no futuro**.
  - **P2** UI avisar quando atingir **10 tags** (server corta hoje).
  - **P2** `address` respeitar `≤500` no client.

### 5.4 Fiado — `app/fiado.tsx`

- **Atual:** lista `status: pending`; ✅ telefone validado antes do WhatsApp; total somado client-side.
- **Recomendado:**
  - **P2** Limitar tamanho da mensagem de cobrança (WhatsApp ~4000 chars).
  - **P2** Se cliente sem telefone, avisar antes de cair no seletor.

### 5.5 Financeiro — `features/finance/components/create-finance-entry.tsx`

- **Atual:** tipo (income/expense) e categoria obrigatórios; `amount > 0`; `description 1–500`; data default hoje.
- **Recomendado:**
  - **P1** `amount` com **máximo** (§4.1).
  - **P1** Data **não no futuro**; limite inferior sensato.
  - **P2** Máscara/validação na data do lançamento (input hoje é livre).
  - **P2** `description` mínimo mais sensato (ex: ≥ 2 chars).

### 5.6 Produtos — `features/products/components/create-product-form.tsx`

- **Atual:** nome (≤200), categoria (≤100), `salePrice > 0`; estoque/alerta inteiros ≥0; `description ≤1000`.
- **Recomendado:**
  - **P1** `salePrice` com **máximo** (§4.1).
  - **P2** Avisar se `salePrice < custo` (preço abaixo do custo).
  - **P2** `stockAlertThreshold ≤ stockQuantity` (validação cruzada).

### 5.7 Insumos/Materiais — `features/materials/components/material-form.tsx`

- **Atual:** nome (≤200), unidade (≤20); estoque/alerta/custo `≥0`; `clampStock` evita negativo.
- **Recomendado:**
  - **P1** `costPerUnit` e estoque com **máximo** (§4.1).
  - **P2** `stockAlertThreshold ≤ stockQuantity`.
  - **P2** Corrigir typos PT-BR nas mensagens ("nao"→"não").

### 5.8 Receitas — `features/recipes/components/*`

- **Atual:** nome (≤200), categoria (≤100), `yieldQuantity` inteiro >0, unidade; ≥1 insumo; cada insumo com `materialId` e `quantity>0` (client); `useLimitCheck("recipes")`; `instructions ≤5000`.
- **Recomendado:**
  - **P0** Enforçar limite de 5 receitas no **backend**.
  - **P0** Backend rejeitar `quantity ≤ 0` de ingrediente (hoje só o client filtra).
  - **P1** `scale(multiplier)` exigir `multiplier > 0`.
  - **P2** Bloquear/mesclar **ingrediente duplicado** (mesmo `materialId`).
  - **P1** Quantidades com **máximo** (§4.1).

### 5.9 Embalagens — `features/packaging/components/create-packaging-form.tsx`

- **Atual:** nome (≤200), tipo (enum), `unitCost > 0`, `supplier ≤200`.
- **Recomendado:**
  - **P0** Adicionar `useLimitCheck("packaging")` no client (**faltando**) + enforçar 3/free no backend.
  - **P1** `unitCost` com **máximo** (§4.1).

### 5.10 Precificação — `features/pricing/components/pricing-calculator.tsx`

- **Atual:** custos `≥0`; `marginPercent 0–1000`; cálculos em tempo real; `calculateCostPerUnit` protege divisão por zero (retorna 0).
- **Recomendado:**
  - **P1** Guardar contra `totalCost = 0` (preço sugerido/lucro sem sentido) — avisar "informe ao menos um custo".
  - **P2** `laborMinutes` com **máximo** (ex: ≤ 1440/dia).
  - **P2** Avisar margem muito baixa (≤10%) ou muito alta (≥500%).

### 5.11 Rótulos — `features/labels/components/create-label-form.tsx` + `app/labels.tsx`

- **Atual:** nome do rótulo e do produto obrigatórios; ✅ datas válidas/plausíveis + aviso de incompleta; "validade em dias" >0; logo/QR opcionais.
- **Recomendado:**
  - **P1** **Validade ≥ Fabricação** (§4.2).
  - **P2** `ingredients ≤ 2000`, `producerAddress ≤ 500`, nutrição `≤100`/campo (contrato+client).
  - **P2** "Telefone do produtor": validar com `isValidBrazilPhone` (hoje só máscara).
  - **P2** Confirmar comportamento do limite freemium de rótulos/templates (1 template no free).

### 5.12 Meta de pró-labore — `features/goals/components/prolabore-goal-form.tsx`

- **Atual:** meta `>0`; custos `≥0`; ticket `>0` se preenchido.
- **Recomendado:**
  - **P1** Máximo em meta/custos/ticket (§4.1) + avisar valor irreal (ex: meta > R$ 100k/mês).

### 5.13 Configurações (perfil) — `app/settings.tsx`

- **Atual:** nome obrigatório (≤200); ✅ telefone mascarado; `businessName ≤200`.
- **Recomendado:**
  - **P2** Telefone: validar dígitos no server (8–15).
  - **P2** `businessType`: definir `≤50` ou enum no contrato.

### 5.14 Login/Cadastro — `app/(auth)/{login,register}.tsx`

- **Atual:** e-mail validado (formato básico); senha ≥8 com maiúscula/minúscula/número; nome ≥2 no cadastro; barra de força.
- **Recomendado:**
  - **P1** **Confirmar senha** no cadastro (campo "Repita a senha").
  - **P1** Senha com **máximo** (ex: ≤128).
  - **P2** Normalizar e-mail (trim/lowercase) e validação mais robusta.
  - **P2** Confirmar **rate limit** de login/cadastro (Supabase).

### 5.15 Onboarding — `app/onboarding.tsx`

- **Atual:** nicho obrigatório (seleção); nome do negócio obrigatório (ou "pular").
- **Recomendado:**
  - **P2** `businessName ≤ 200` (alinhar com perfil).
  - **P2** Garantir persistência do progresso (não perder em reload/crash).

---

## 6. Backlog priorizado (resumo acionável)

**P0 — antes de produção**

1. Enforçar limites freemium no **backend** (sales/clients/recipes/packaging).
2. `useLimitCheck("packaging")` no client (está faltando).
3. Backend rejeitar `quantity ≤ 0` de ingrediente de receita.

**P1 — importante** 4. Máximos numéricos em dinheiro/quantidade (contratos Zod) — anti-absurdo/overflow. 5. Regras de data: Validade ≥ Fabricação; encomenda não no passado; financeiro/aniversário não no futuro. 6. Encomenda `amount > 0` se preenchido. 7. `scale(multiplier) > 0` em receitas. 8. Cadastro: confirmar senha + senha `≤128`. 9. Precificação: tratar `totalCost = 0`.

**P2 — melhorias** 10. Telefone uniforme (rótulo/produtor) e no server (settings). 11. Máx de texto livre faltantes (ingredients/address/nutrição/notes); avisar 10 tags. 12. Avisos de UX: preço < custo, margem extrema, uso do limite (ex: 5/20 clientes), typos PT-BR. 13. `businessType` tipado; e-mail normalizado; rate limit.

---

## 7. Como implementar (padrão)

1. **Contrato (Zod)** em `packages/contracts/src/schemas/*` — `.max()`, `.positive()`, `.refine()` p/ regras cruzadas (ex: validade ≥ fabricação).
2. **Domain** (`*.domain.ts`) — regras de negócio/limites freemium; retornar `ValidationError` com mensagem PT-BR.
3. **Client** — guard + `Alert` amigável (espelha a regra) e máscara onde fizer sentido; nunca a única barreira.
4. **Teste** — caso unitário no `*.domain.test.ts`/util; atualizar [ADR 0001 §6](./0001-plano-de-testes-telas.md) ao corrigir uma incoerência.

## 8. Manutenção

- Ao criar/alterar tela com entrada de dados, atualizar este documento (matriz §5) e o `ai.context.*.md` da feature.
- Itens concluídos passam a ✅ com a referência do commit.
