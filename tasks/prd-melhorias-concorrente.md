# PRD: Melhorias inspiradas em reviews do concorrente — Lucro Caseiro

> Status: **Planejado** (spec / backlog priorizado).
> Origem: análise das avaliações públicas do app concorrente **"Doce Lucro –
> Precificação" (JSL Apps, 4,9★)** na Google Play, coletadas em **30/05/2026**.
> Objetivo: transformar pedidos reais de usuários do nicho (confeitaria/precificação)
> em backlog acionável para o Lucro Caseiro.

## Introdução

As avaliações do concorrente revelam **o que falta** num app de precificação maduro
e o que os usuários mais pedem. Cada item abaixo cita o review de origem e os votos
de "achei útil" como **sinal de demanda**. Vários itens podem **já existir** parcialmente
no Lucro Caseiro — marcados com ⚠️ **validar implementação atual** antes de codar.

## Como ler

- **Prioridade**: P0 (alta demanda / baixo esforço), P1 (importante), P2 (nice-to-have).
- **Sinal**: votos "X acharam útil" + nº de reviews que pedem o mesmo.
- Cada feature traz: problema → solução proposta → critérios de aceite.

---

## Backlog priorizado (resumo)

| #   | Feature                                               | Tema         | Prioridade | Sinal (reviews/votos)              |
| --- | ----------------------------------------------------- | ------------ | ---------- | ---------------------------------- |
| 1   | Duplicar receita/produto                              | Receitas     | **P0**     | Carlos R. (11 úteis)               |
| 2   | Editar quantidade de ingrediente in-place             | Receitas     | **P0**     | Carolina Y. (4 úteis)              |
| 3   | Taxas iFood/cartão e despesas em **%**                | Despesas     | **P0**     | Bettas (19 úteis) + Yarana + Joyce |
| 4   | Mão de obra: horas trabalhadas + tempo de execução    | Precificação | **P1**     | Joyce M. (8 úteis)                 |
| 5   | Combinar receitas → produto composto / kit / caixinha | Produtos     | **P1**     | Adriana S. (2) + José A.           |
| 6   | Cadastro de **embalagens** com valor                  | Custos       | **P1**     | Andreza R. (2)                     |
| 7   | Separar **gastos fixos × variáveis**                  | Despesas     | **P1**     | Jhenifer                           |
| 8   | Venda por **peso** (kg)                               | Precificação | **P1**     | Doce Encanto (2)                   |
| 9   | Rendimento em **kg e gramas** (além de un.)           | Receitas     | **P2**     | Carlos J. (1)                      |
| 10  | **Modo de preparo / ficha técnica** na receita        | Receitas     | **P2**     | José A. (1)                        |
| 11  | **Imprimir/exportar** receita                         | Receitas     | **P2**     | Michela C.                         |
| 12  | Pró-labore/salário + divisão do dinheiro recebido     | Financeiro   | **P2**     | Chef Raquel (2)                    |
| 13  | **Somar valores dos pedidos** (visão de vendas)       | Vendas       | **P2**     | bruno nery                         |
| 14  | Insumos de **bebida**: clareza un. × grama            | Receitas     | **P2**     | Patricia C. (4)                    |

> Observação: itens 4, 12 podem se sobrepor ao `prd-meta-prolabore.md`; itens 6, 14 ao
> `prd-insumos.md`. **Consolidar** antes de implementar para não duplicar.

---

## P0 — Alta prioridade

### 1. Duplicar receita/produto

- **Review:** Carlos Ricci (12/02/2025, 11 úteis): _"coloca nas receitas a opção de
  duplicar... tenho uma receita que vendo em pote de 140ml, 250ml e 500ml. Fazendo a
  cópia eu só mudava a embalagem, o resto é igual."_
- **Problema:** usuário recria a mesma receita várias vezes só para variar embalagem/
  porção. Trabalhoso e propenso a erro.
- **Solução:** botão **"Duplicar"** na receita/produto → cria cópia editável (nome
  `"X (cópia)"`), com todos os ingredientes/custos. Usuário ajusta só o que muda.
- **Critérios de aceite:**
  - [ ] Ação "Duplicar" disponível na lista e no detalhe da receita.
  - [ ] A cópia é independente (editar uma não altera a outra).
  - [ ] Copia ingredientes, quantidades, rendimento, embalagem e configs de preço.
  - [ ] Nome sugerido editável antes de salvar.

### 2. Editar quantidade de ingrediente in-place

- **Review:** Carolina P. Yoshida (16/03/2025, 4 úteis): _"só poderia ter a opção de
  editar a quantidade de um ingrediente. Mas preciso apagar e adicionar de novo."_
- **Problema:** não dá para editar a quantidade de um ingrediente já adicionado —
  precisa remover e readicionar. UX ruim, alto atrito.
- **Solução:** tornar a quantidade (e unidade) **editável** direto na linha do
  ingrediente dentro da receita.
- **Critérios de aceite:**
  - [ ] Tocar na quantidade abre edição inline (sem remover o ingrediente).
  - [ ] Recalcula custo/preço imediatamente ao salvar.
  - [ ] Vale para ingredientes e embalagens.
- **Nota:** baixo esforço, alto valor — bom **quick win**.

### 3. Taxas (iFood, cartão) e despesas em PORCENTAGEM

- **Reviews:**
  - Bettas Iniciantes (05/04/2025, **19 úteis**): _"acrescentar as opções de taxas do
    iFood e taxa de cartão em porcentagem no menu despesas."_
  - Yarana Castro Felix (18/05/2025): _"falta uso de despesas em % por exemplo para
    despesas do iFood que é calculado em porcentagem não em reais."_
- **Problema:** taxas de marketplace/cartão são **percentuais sobre a venda**, mas o app
  só aceita valor fixo (R$). Isso distorce a precificação.
- **Solução:** permitir despesa/taxa como **% do preço de venda** (além de valor fixo).
  Aplicar no cálculo do preço final. Sugerir presets: iFood, cartão débito/crédito.
- **Critérios de aceite:**
  - [ ] Cada despesa pode ser "Valor fixo (R$)" **ou** "Percentual (%)".
  - [ ] Percentuais incidem sobre o preço de venda final (com tratamento de markup).
  - [ ] Presets rápidos: iFood, cartão, comissão.
  - [ ] O preço sugerido reflete as taxas % corretamente (sem prejuízo na margem).
- **Nota:** **maior sinal de demanda** (19 úteis). Forte candidato a P0.

---

## P1 — Importante

### 4. Mão de obra: horas trabalhadas + tempo de execução

- **Review:** Joyce Mendes (24/12/2024, 8 úteis): _"faltou informar as horas trabalhadas
  para calcular o valor da mão de obra e também o tempo de execução de uma receita."_
- **Problema:** mão de obra não entra no custo da receita. Subprecificação.
- **Solução:** campo **valor/hora** (perfil) + **tempo de execução** por receita →
  custo de mão de obra = valor/hora × tempo. Soma ao custo total.
- **Critérios de aceite:**
  - [ ] Configurar valor da hora de trabalho (uma vez, no perfil).
  - [ ] Cada receita tem "tempo de execução" (min/h).
  - [ ] Custo de mão de obra entra no custo total e no preço sugerido.
- **Nota:** verificar sobreposição com `prd-meta-prolabore.md`.

### 5. Combinar receitas → produto composto / kit / caixinha

- **Reviews:**
  - Adriana Silva (14/12/2025, 2 úteis): _"precisa ter como combinar produtos... fiz um
    produto com combinação de receitas. Com essa combinação quero fazer uma caixinha."_
  - José Alberto Passos (relacionado): montar produto a partir de itens.
- **Problema:** não dá para montar um **produto composto** (kit/caixa/combo) a partir de
  várias receitas/produtos já cadastrados.
- **Solução:** novo tipo **"Produto composto"** que referencia N receitas/produtos
  (com quantidade de cada) e soma custos/preços automaticamente.
- **Critérios de aceite:**
  - [ ] Criar produto composto selecionando receitas/produtos existentes + quantidades.
  - [ ] Custo e preço sugerido somam os componentes (+ embalagem do kit).
  - [ ] Editar um componente reflete no composto.

### 6. Cadastro de embalagens com valor

- **Review:** Andreza Rocha (28/04/2025, 2 úteis): _"deveria ter uma parte onde colocasse
  os valores das embalagens."_
- **Problema:** custo de embalagem não é destacado/reutilizável.
- **Solução:** catálogo de **embalagens** (nome + custo unitário) reutilizável nas
  receitas/produtos. ⚠️ **validar:** o `prd-insumos.md` já menciona "embalagens" — pode
  já existir parcialmente; consolidar.
- **Critérios de aceite:**
  - [ ] Cadastrar embalagem com custo.
  - [ ] Associar embalagem(ns) a uma receita/produto → entra no custo.

### 7. Separar gastos fixos × variáveis

- **Review:** Jhenifer (27/11/2025): _"gostaria que tivesse uma aba para separar gastos
  fixos e variáveis."_
- **Problema:** despesas não categorizadas → difícil entender estrutura de custo.
- **Solução:** classificar cada despesa como **fixa** ou **variável**; visão/aba que
  agrupa e soma por tipo. Base para rateio de fixos no preço.
- **Critérios de aceite:**
  - [ ] Toggle fixo/variável em cada despesa.
  - [ ] Visão agrupada por tipo com totais.

### 8. Venda por peso (kg)

- **Review:** Doce Encanto (10/03/2025, 2 úteis): _"seria legal se tivesse venda por peso.
  Ex.: bolo de aniversário e pudim eu vendo por quilo."_
- **Problema:** alguns produtos são vendidos por **peso** (R$/kg), não por unidade.
- **Solução:** unidade de venda **por peso**; preço final = R$/kg × peso. Precificação
  calcula custo por kg do produto.
- **Critérios de aceite:**
  - [ ] Produto pode ser "por unidade" ou "por peso (kg/g)".
  - [ ] Preço sugerido por kg derivado do custo.

---

## P2 — Nice-to-have

### 9. Rendimento em kg e gramas (além de unidades)

- **Review:** Carlos Jhonatan (18/03/2025, 1 útil): _"colocar na opção de rendimento em kg
  e em gramas também."_
- **Solução:** rendimento da receita aceita un. **e** peso (kg/g) → custo por porção e
  por grama/kg. Sinergia com item 8.

### 10. Modo de preparo / ficha técnica

- **Review:** José Alberto Passos (26/11/2025, 1 útil): _"ter um local pra se colocar como
  fazer os quitutes... a ficha técnica."_
- **Solução:** campo de texto **"Modo de preparo"** na receita (ficha técnica).
  Sinergia com item 11 (imprimir).

### 11. Imprimir / exportar receita

- **Review:** Michela Cardoso (22/04/2026): _"opção para imprimir receitas."_
- **Solução:** gerar **PDF/compartilhar** da receita (ingredientes + custo + modo de
  preparo). Útil para produção e equipe.

### 12. Pró-labore/salário + divisão do dinheiro recebido

- **Review:** Chef Raquel Barbosa (08/07/2025, 2 úteis): _"na assinatura paga tem campo
  onde colocamos nosso salário, e fazer a divisão do dinheiro recebido?"_
- **Solução:** definir **pró-labore/meta de salário** e ver quanto separar do faturamento.
  ⚠️ provável sobreposição com `prd-meta-prolabore.md` — consolidar lá.

### 13. Somar valores dos pedidos (visão de vendas)

- **Review:** bruno nery (12/05/2026): _"só tinha que somar os valores dos pedidos para
  quem paga o aplicativo."_
- **Solução:** registro simples de **pedidos/vendas** com soma de faturamento no período.
  (Feature maior — pode virar PRD próprio se virar foco.)

### 14. Insumos de bebida: clareza unidade × grama

- **Review:** Patricia Cristina (17/05/2025, 4 úteis): _"explicar melhor sobre insumos de
  bebida como colocar, alguns que têm gramas e é por unidade."_
- **Solução:** melhorar UX/ajuda ao cadastrar insumo com **unidade de compra ≠ unidade de
  uso** (ex.: compra por unidade, usa por grama). Conversão clara. ⚠️ ligar ao
  `prd-insumos.md`.

---

---

## Estado atual no Lucro Caseiro (auditoria do código)

> Auditoria feita em 30/05/2026 no repo. **Boa notícia: metade dos itens já existe ou é
> parcial** → muito é **adaptar/expor**, não construir do zero.

### Arquitetura (resumo)

- **API**: Express + Drizzle/Supabase, vertical slices em `apps/api/src/features/<f>/`
  (`*.routes.ts` · `*.usecases.ts` · `*.domain.ts` · `*.repo.pg.ts` · `*.types.ts`).
- **Mobile**: Expo Router + NativeWind, `apps/mobile/src/features/<f>/`.
- **Schema**: `packages/database/src/schema/`; contratos em `packages/contracts/src/schemas/`.
- **Modelo-chave**: receitas consomem **`materials`** (insumos unificados) via
  `recipe_ingredients`. Preço em `pricing_calculations`
  (`suggestedPrice = totalCost × (1 + margemPercent/100)`).

### Mapa: já existe × adaptar × inserir

| #   | Feature                          | Status hoje                                                     | Ação                                                  | Onde mexer                                  |
| --- | -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| 1   | Duplicar receita                 | ❌ MISSING                                                      | **INSERIR** (baixo)                                   | `recipes.{usecases,repo.pg,routes}.ts`      |
| 2   | Editar qtd ingrediente inline    | ❌ MISSING                                                      | **INSERIR** (médio)                                   | `recipes.*` + `recipe-materials-editor.tsx` |
| 3   | Taxas iFood/cartão em %          | ❌ MISSING                                                      | **INSERIR + migration**                               | `pricing.{domain,usecases}.ts` + schema     |
| 4   | Mão de obra (horas × valor/h)    | 🟡 PARCIAL (`laborCost` manual; meta pró-labore existe)         | **ADAPTAR + INSERIR** (execTime + valor/h)            | `recipes` schema + `pricing.domain.ts`      |
| 5   | Produto composto (kit/caixinha)  | ❌ MISSING                                                      | **INSERIR** (alto)                                    | nova tabela `product_components`            |
| 6   | Embalagens → receita             | 🟡 PARCIAL (catálogo `packaging` existe, ligado a **produtos**) | **ADAPTAR** (junção `recipe_packaging` + puxar custo) | `packaging.ts` + pricing                    |
| 7   | Gastos fixos × variáveis         | ❌ MISSING                                                      | **INSERIR** (add `isFixed`)                           | `finance.ts` schema + domain                |
| 8   | Venda por peso (kg)              | ❌ MISSING                                                      | **INSERIR**                                           | `sale_items`/`products` schema + domain     |
| 9   | Rendimento kg/g                  | 🟡 PARCIAL (`yieldQuantity` int + `yieldUnit` texto)            | **ADAPTAR** (yield decimal + peso)                    | `recipes.ts`                                |
| 10  | Modo de preparo / ficha técnica  | ✅ **EXISTE no schema** (`recipes.instructions`)                | **ADAPTAR — só expor na UI** ⚡                       | forms de receita no mobile                  |
| 11  | Imprimir/exportar receita        | ❌ MISSING (mas há `expo-print` nos rótulos)                    | **INSERIR** (reusar expo-print)                       | novo `GET /recipes/:id/export`              |
| 12  | Pró-labore + divisão do dinheiro | 🟡 PARCIAL (meta + progresso existem em `business_goals`)       | **ADAPTAR** (add "repasse/divisão")                   | `goals.{domain,usecases}.ts`                |
| 13  | Somar valores dos pedidos        | ✅ EXISTE (finance + sales agregam)                             | **ADAPTAR** (ponte `orders` → finance)                | `insights`/`finance` + `orders`             |
| 14  | Insumo: unidade compra × uso     | 🟡 PARCIAL (2 units guardadas, sem conversão)                   | **INSERIR** (`unit_conversions` + `convert()`)        | `materials`/`recipes` domain                |

**Status de implementação (atualizado 30/05/2026, após inspeção do código):**

- ✅ **#1 Duplicar receita** — **IMPLEMENTADO**: `POST /recipes/:id/duplicate` (reusa
  `repo.create`, respeita limite freemium) + hook `useDuplicateRecipe` + botão "Duplicar
  receita" no detalhe. Commit `feat(recipes): add duplicate recipe (api + mobile)`.
- ✅ **#2 Editar qtd de ingrediente inline** — **JÁ EXISTIA**: `recipe-materials-editor.tsx`
  tem um campo de **Quantidade por linha** (edita sem remover); usado nos forms de criar e
  editar. A reclamação era do concorrente — o Lucro Caseiro já resolve. **Nada a fazer.**
- ✅ **#10 Modo de preparo / ficha técnica** — **JÁ EXISTIA**: campo "Modo de preparo
  (opcional)" nos forms de **criar e editar**, e exibido no detalhe. **Nada a fazer.**
- ✅ **#3 Taxas/despesas em %** — **IMPLEMENTADO**: `feesPercent` no cálculo + inputs
  iFood%/cartão% no passo 5 da calculadora, com **gross-up** (preserva a margem) e preço
  final no resultado. Migration `004_pricing_percentage_fees.sql`. Commit
  `feat(pricing): add percentage sale fees (ifood/card) with gross-up`.

---

## P0 — Quebra em tarefas técnicas

### P0.1 — Duplicar receita (sem migration)

- [ ] **API** `recipes.repo.pg.ts`: `duplicateRecipe(userId, recipeId)` → cria receita +
      clona todas as linhas de `recipe_ingredients` com o novo `recipeId`.
- [ ] **API** `recipes.usecases.ts`: `duplicate(userId, recipeId)` (nome `"X (cópia)"`,
      copia rendimento/instruções/ingredientes).
- [ ] **API** `recipes.routes.ts`: `POST /recipes/:id/duplicate` → 201 com a nova receita.
- [ ] **Mobile** `recipes/hooks.ts`: `useDuplicateRecipe()`.
- [ ] **Mobile** `recipes/components/recipe-detail.tsx`: ação **"Duplicar"**.
- **Aceite:** cópia independente; copia ingredientes/rendimento/embalagem; nome editável.

### P0.2 — Editar quantidade de ingrediente inline (sem migration)

- [ ] **API** `recipes.repo.pg.ts`: `updateIngredientQuantity(recipeId, materialId, qty)`.
- [ ] **API** `recipes.domain.ts`: validar `qty > 0` (e teto razoável).
- [ ] **API** `recipes.usecases.ts`: `updateIngredientQuantity(...)` + escopo por `userId`.
- [ ] **API** `recipes.routes.ts`: `PATCH /recipes/:id/ingredients/:materialId`.
- [ ] **Mobile** `recipe-materials-editor.tsx`: tocar na qtd → editar inline → salvar.
- [ ] **Mobile** `recipes/hooks.ts`: `useUpdateRecipeIngredient()`.
- **Aceite:** edita sem remover; recalcula custo/preço na hora; vale p/ ingrediente e embalagem.

### P0.3 — Taxas (iFood/cartão) e despesas em % (com migration)

- [ ] **DB** migration: tabela reutilizável **`fee_templates`** (`userId`, `name`,
      `feePercent`) — recomendado p/ reuso (iFood 15%, cartão 3%…). _(Alternativa MVP: colunas
      `ifoodFeePercent`/`cardFeePercent` em `pricing_calculations`.)_
- [ ] **Schema** `packages/database/src/schema/pricing.ts` + (opcional) `fee_templates.ts`.
- [ ] **Contracts** `schemas/pricing.ts`: aceitar lista de taxas %.
- [ ] **API** `pricing.domain.ts`: aplicar taxa **sobre o preço de venda** com **gross-up**
      (ver aviso abaixo); retornar valor de cada taxa + preço final.
- [ ] **API** `pricing.usecases.ts`: receber taxas no cálculo.
- [ ] **Mobile** `pricing/components/pricing-calculator.tsx`: inputs iFood%/cartão% + presets.
- **Aceite:** cada despesa = "fixa (R$)" **ou** "% da venda"; a margem é **preservada** após a taxa.

> ⚠️ **Cuidado matemático (gross-up):** taxa percentual incide sobre o **preço de venda**, não
> sobre o custo. Somar `preço × taxa%` ao custo **subestima** o preço. O correto p/ manter a
> margem é dividir:
> `preço = custoBase × (1 + margem%) / (1 − somaTaxas%)`.
> Ex.: custo R$10, margem 100% (→ R$20), iFood 15% + cartão 3% (18%):
> preço = 20 / (1 − 0,18) = **R$24,39** (não R$23,60).

**Ordem sugerida de implementação:** ⚡ #10 (1h, aquece) → P0.2 → P0.1 → P0.3.

---

## Próximos passos

1. **Consolidar** itens 4/12 com `prd-meta-prolabore.md` e 6/14 com `prd-insumos.md`
   (evitar duplicar schema).
2. Implementar os **quick wins** (#10, P0.2, P0.1) — alto valor, sem migration.
3. Implementar **P0.3 (taxas %)** com atenção ao gross-up — é o **maior pedido** (19 úteis).
4. Revisitar P1/P2 conforme feedback dos usuários do próprio Lucro Caseiro.

## Changelog

- 2026-05-30: criação a partir das reviews públicas do concorrente "Doce Lucro –
  Precificação" (JSL Apps).
- 2026-05-30: auditoria do código adicionada (já existe × adaptar × inserir) + quebra
  técnica dos P0.
- 2026-05-30: **#7 Gastos fixos × variáveis implementado** (P1) — coluna `is_fixed`
  (migration 005), toggle Fixo/Variável no form de despesa, split fixo/variável no resumo
  - filtro `?fixed=`. **#4 (mão de obra) e #6 (embalagens) já existiam** → P1 restantes
    reais: #5 (produto composto), #8 (venda por peso). 384 testes da API passando.
- 2026-05-30: **#3 Taxas/despesas em % implementado** (api + mobile + migration 004 +
  gross-up). Os 3 P0 estão resolvidos (#1 implementado; #2 e #10 já existiam).
- 2026-05-30: **#1 Duplicar receita implementado** (api + mobile). Inspeção do código
  revelou que **#2 (editar qtd inline) e #10 (modo de preparo) já existiam** no Lucro
  Caseiro (eram lacunas do concorrente) → removidos do backlog de implementação. Próximo
  P0 real = **#3 taxas/despesas em %**.
