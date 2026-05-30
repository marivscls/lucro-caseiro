# ADR/PRD 0001 — Plano de Testes Gerais das Telas

> **Tipo:** ADR (decisão de estratégia) + PRD (especificação de testes)
> **Status:** Aceito · **Data:** 2026-05-30 · **Escopo:** App mobile (`apps/mobile`) e contratos compartilhados
> **Objetivo:** Garantir cobertura de teste e **coerência entre telas** — nenhuma divergência de formato, idioma, estado ou regra deve passar para produção.

---

## 1. Contexto

O Lucro Caseiro tem dezenas de telas (vendas, encomendas, clientes, finanças, receitas, insumos, precificação, embalagens, rótulos, fiado, configurações) construídas como _vertical slices_. Cada feature evolui sozinha, o que gera **risco de incoerência transversal**: a mesma data formatada de dois jeitos, moeda diferente, telefone sem máscara em uma tela e com máscara em outra, estados de vazio/erro inconsistentes, etc.

O público (empreendedores caseiros, 15–70+, baixa familiaridade técnica) é sensível a qualquer inconsistência: ela quebra a confiança e contradiz o **Princípio #1 (simplicidade radical)**.

## 2. Decisão

Adotamos uma **estratégia de testes em camadas** + um **checklist de coerência global** aplicado a **toda** tela, versionado neste documento e revisado a cada feature nova (junto com o `ai.context.*.md` da feature).

### 2.1 Camadas de teste

| Camada                     | Ferramenta                      | O que cobre                                                        | Onde                                    |
| -------------------------- | ------------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| **Domínio (puro)**         | Vitest                          | Regras puras, formatação, agrupamento, validação                   | `*.domain.test.ts`, `*.test.ts` (utils) |
| **Usecases (API)**         | Vitest + mocks via interface    | Fluxos, autorização, limites freemium, erros                       | `*.usecases.test.ts`                    |
| **Componente/Tela**        | Vitest + RTL (quando aplicável) | Render, estados (loading/vazio/erro), validação de formulário      | `*.test.tsx`                            |
| **Manual (dev build)**     | Checklist (seção 5–6)           | Navegação real, módulos nativos (print, QR, notificação, WhatsApp) | Roteiro por release                     |
| **Auditoria de coerência** | Checklist (seção 4)             | Consistência transversal entre todas as telas                      | Pré-release                             |

### 2.2 Convenções (já vigentes no projeto — manter)

- **AAA** (Arrange / Act / Assert), **SUT factory**, fixtures claros.
- Mocks **apenas via interfaces** (`IXxxRepo`); funções puras de domínio não usam mocks.
- Nunca remover teste sem substituir por equivalente.
- Toda feature nova: mínimo `*.domain.test.ts` + `*.usecases.test.ts`.
- Gate local (`pnpm prepush`) e CI rodam lint + typecheck + test + sherif + knip + context:lint.

## 3. Consequências

- **Prós:** divergências detectadas antes do release; onboarding de novas features mais seguro; documento único de verdade para QA.
- **Contras:** exige disciplina de atualizar o checklist a cada feature; parte do roteiro é manual (módulos nativos não rodam em ambiente headless/Expo Go).

---

## 4. Checklist de COERÊNCIA GLOBAL (aplicar a TODA tela)

> Estes itens devem ser verdadeiros em **todas** as telas. Qualquer divergência é uma **incoerência** a corrigir.

### 4.1 Idioma e linguagem

- [ ] Todo texto visível em **português (pt-BR)**; código em inglês.
- [ ] **Zero jargão técnico** ("Quanto você lucrou", não "Margem líquida").
- [ ] Mensagens de erro humanas e acionáveis (o que fazer a seguir).

### 4.2 Formatos (fonte única da verdade)

- [ ] **Moeda:** sempre `R$ 1.234,56` (vírgula decimal, ponto de milhar). Mesmo formatador em todas as telas.
- [ ] **Data exibida:** sempre `DD/MM/AAAA`. **Armazenada:** ISO `AAAA-MM-DD`. Nunca exibir ISO ao usuário.
- [ ] **Telefone exibido/digitado:** máscara `(XX) XXXXX-XXXX`. Normalização para WhatsApp via `normalizePhone` (DDI por tamanho).
- [ ] **Percentual/quantidade:** vírgula decimal, coerente em precificação/estoque.

### 4.3 Rótulos de domínio (mesmos termos em todo lugar)

- [ ] **Forma de pagamento:** Pix · Dinheiro · Cartão · Fiado · Transferência (nunca "credit"/"cash" cru na UI).
- [ ] **Status de venda:** Pago · Pendente · Cancelado.
- [ ] **Status de encomenda:** A fazer · Produzindo · Pronto · Entregue · Cancelada.
- [ ] Cores/tons de status consistentes (sucesso=verde, alerta=âmbar, perigo=vermelho).

### 4.4 Estados de tela (os três sempre tratados)

- [ ] **Carregando:** `ActivityIndicator` (nunca tela em branco).
- [ ] **Vazio:** `EmptyState` com título amigável + ação principal (ex: "Nova venda").
- [ ] **Erro:** mensagem clara + caminho de recuperação (tentar novamente).

### 4.5 UX / Acessibilidade (PRD)

- [ ] **Máx. 3 toques** para a ação principal da tela.
- [ ] Botões com toque mínimo **48×48dp**; fontes ≥ **16px**.
- [ ] Contraste **WCAG AA** (≥ 4.5:1) — inclusive textos sobre cards coloridos.
- [ ] Ícones sempre acompanhados de texto.
- [ ] Todo **modal** tem "Fechar/Cancelar" visível.
- [ ] Feedback imediato em ações (confirmação/alert ou estado de loading no botão).

### 4.6 Dados e segurança

- [ ] Toda query escopada por **`userId`** (sem query global).
- [ ] **Limites freemium** enforçados no **backend**; a UI apenas projeta (paywall coerente, mesma mensagem).
- [ ] Dados de cliente/financeiros tratados como sensíveis (sem log indevido).

### 4.7 Integrações externas

- [ ] **WhatsApp:** valida número antes de abrir; avisa se inválido ou se o app não abrir; cai no seletor quando não há telefone. Nunca envia sozinho.
- [ ] **PDF/Print/QR (rótulos):** dependem de módulo nativo — testar em **dev build**, não Expo Go.
- [ ] **Notificações:** agendadas localmente; cancelar/reagendar coerente com o ciclo de vida do dado.

---

## 5. Matriz de testes POR TELA

> Legenda: **H** = happy path · **V** = validação · **E** = estados (loading/vazio/erro) · **C** = coerência específica.

### 5.1 Autenticação — `/(auth)/login`, `/(auth)/register`

- [ ] H: login com credenciais válidas entra no app; logout volta ao login.
- [ ] V: e-mail inválido / senha curta bloqueados com mensagem clara.
- [ ] E: erro de rede mostra mensagem (não trava).
- [ ] C: idioma pt-BR; sem expor mensagens de erro do Supabase cru.

### 5.2 Onboarding — `/onboarding`

- [ ] H: completa o fluxo e marca como visto (não reaparece).
- [ ] C: linguagem simples; pulável; respeita 3 toques.

### 5.3 Home — `/tabs` (index)

- [ ] H: mostra resumo do dia (vendas, valor, ticket) e atalhos rápidos.
- [ ] E: sem vendas → estado vazio amigável.
- [ ] C: moeda `R$`; resumo do dia atualiza (auto-refresh 60s); contagem de encomendas próximas coerente com a Agenda.

### 5.4 Vendas (lista) — `/tabs/sales`

- [ ] H: lista agrupada por data (Hoje/Ontem/data); filtros Todas/Pendentes/Concluídas/Canceladas.
- [ ] V: busca por produto/cliente filtra corretamente.
- [ ] E: filtro sem resultado → vazio coerente; loading; erro.
- [ ] C: chips de filtro **sempre visíveis no primeiro render** (regressão conhecida — ver 6.1); status e pagamento com rótulos corretos.

### 5.5 Nova venda (wizard) — `/tabs/new-sale`

- [ ] H: produtos → cliente (ou avulso) → pagamento → revisar → registрar; baixa de estoque ocorre.
- [ ] V: carrinho não-vazio; forma de pagamento obrigatória; limite freemium bloqueia e mostra paywall.
- [ ] E: sem produtos cadastrados → modal de criar produto.
- [ ] C: 4 passos = 4 toques; total recalcula ao add/remover; rótulos de pagamento corretos; venda fiado nasce **pendente**.

### 5.6 Clientes (lista + detalhe) — `/tabs/clients`

- [ ] H: criar/editar/excluir cliente; busca por nome/telefone; detalhe com histórico de compras.
- [ ] V: nome obrigatório; **telefone validado (`isValidBrazilPhone`)**; limite freemium de clientes.
- [ ] C: **telefone com máscara** ao digitar; botões WhatsApp/Parabéns só com telefone; aniversário — **ver incoerência 6.2**.

### 5.7 Agenda / Encomendas — `/agenda`

- [ ] H: criar encomenda (título, data, hora, valor); trocar status; "entregar" (com/sem registrar receita); excluir.
- [ ] V: título obrigatório; data `DD/MM/AAAA` válida; hora `HH:MM`.
- [ ] E: sem encomendas → vazio; grupos vazios omitidos.
- [ ] C: agrupamento Atrasadas/Hoje/Amanhã/Semana/Próximas/Finalizadas; **lembrete agendado** na véspera 9h cancela ao entregar/excluir; "entregar com receita" cria lançamento no Financeiro.

### 5.8 Fiado — `/fiado`

- [ ] H: lista vendas pendentes agrupadas por cliente; total a receber; "Recebi" marca como paga; "Cobrar no WhatsApp".
- [ ] E: ninguém deve → vazio "🎉".
- [ ] C: total por cliente e total geral batem com as vendas; cobrança usa telefone do cliente (senão seletor); ordenado por maior valor.

### 5.9 Financeiro — `/finance`

- [ ] H: lançar entrada/saída; ver saldo/lucro do período.
- [ ] V: valor > 0; tipo obrigatório.
- [ ] C: moeda coerente; receita de venda/encomenda aparece aqui; relatório completo é premium.

### 5.10 Produtos — `/products`

- [ ] H: criar/editar produto com foto, preço, estoque; baixa via venda.
- [ ] V: nome, categoria, preço > 0.
- [ ] C: foto salva aparece no detalhe; alerta de estoque baixo coerente; moeda.

### 5.11 Insumos / Materiais — `/materials`

- [ ] H: cadastrar insumo, unidade, custo, estoque; usado em receitas.
- [ ] V: custo/quantidade numéricos.
- [ ] C: unificação ingredientes→materiais consistente; custo reflete na precificação.

### 5.12 Receitas — `/recipes`

- [ ] H: criar receita com insumos e rendimento; custo calculado.
- [ ] V: nome obrigatório; rendimento > 0; limite freemium de receitas.
- [ ] C: custo da receita = soma insumos; alimenta a precificação.

### 5.13 Precificação — `/pricing`

- [ ] H: calcula preço a partir de custo + margem desejada.
- [ ] V: custo ≥ 0 (tratar custo zero); margem válida.
- [ ] C: resultado em `R$`; histórico só premium; sem jargão (usar "quanto cobrar").

### 5.14 Embalagens — `/packaging`

- [ ] H: cadastrar embalagem com custo; vincular a produto.
- [ ] V: custo numérico; limite freemium (3 no free).
- [ ] C: custo entra no preço; moeda.

### 5.15 Rótulos — `/labels`

- [ ] H: criar/editar rótulo (template, produto, ingredientes, datas, produtor, telefone, **logo**, **QR**, **tabela nutricional**); preview ao vivo; baixar/compartilhar PDF; várias por folha.
- [ ] V: nome do rótulo e nome do produto obrigatórios; datas com máscara; "validade em dias" calcula a validade.
- [ ] E: lista vazia → criar; erro de upload de logo → salva sem logo e avisa.
- [ ] C: **datas exibidas DD/MM/AAAA** no preview e no PDF (regressão corrigida — 6.3); QR preto; telefone do produtor com máscara; remover logo no editar envia `logoUrl: null`.

### 5.16 Configurações — `/settings`

- [ ] H: editar perfil (nome, negócio, tipo, telefone); ver/gerenciar assinatura; meta de pró-labore; privacidade.
- [ ] V: telefone com máscara.
- [ ] C: estado premium/free coerente com o resto do app; links de política abrem.

### 5.17 Mais — `/tabs/more`

- [ ] H: navega para todas as entradas (Agenda, Financeiro, **Fiado**, Produtos, Insumos, Receitas, Precificação, Embalagens, Rótulos, Configurações).
- [ ] C: toda rota listada existe e está registrada no `_layout`; ícone + texto.

---

## 6. Incoerências candidatas detectadas (NÃO deixar passar)

> Itens concretos levantados nesta auditoria. ✅ = já corrigido · ⚠️ = a verificar/corrigir.

1. ✅ **6.1 — Chips de filtro de Vendas** não apareciam no primeiro render (ScrollView horizontal colapsava). Corrigido para `flex-wrap`. _Teste de regressão: chips visíveis no mount._
2. ⚠️ **6.2 — Aniversário do cliente em formato ISO.** O formulário de cliente usa placeholder/parse **`AAAA-MM-DD`**, enquanto **todas as outras datas do app são `DD/MM/AAAA` com máscara**. Incoerência de formato e de UX. _Ação sugerida: aplicar a mesma máscara/conversão das datas do rótulo (`maskDateBR`/`brToIso`/`isoToBR`)._
3. ✅ **6.3 — Datas do rótulo salvas em ISO apareciam cruas** no rótulo salvo e no PDF. Corrigido com `isoToBR` no preview e no PDF.
4. ✅ **6.4 — Telefone sem máscara** em vários campos. Padronizado: máscara em cliente (criar/editar), rótulo (produtor) e configurações; validação que bloqueia apenas no cliente.
5. ✅ **6.5 — `wa.me` com DDI errado para DDD 55.** `normalizePhone` passou a decidir o DDI **pelo tamanho** do número.
6. ⚠️ **6.6 — Moeda: formatador duplicado em ~10+ telas/arquivos** (`fiado`, `packaging`, `pricing`, `products`, `tabs/index`, `new-sale`, `client-card`, `client-detail`, `finance-dashboard`, `finance-entry-list`, `receipt`, …). Alto risco de divergir (com/sem separador de milhar). _Ação sugerida: centralizar **um** `formatCurrency` em `@lucro-caseiro/ui` ou `shared/utils` e reutilizar; testar `R$ 1.234,56`._
7. ⚠️ **6.7 — Labels de pagamento duplicados.** O mapa Pix/Dinheiro/Cartão/Fiado/Transferência aparece em `sale-detail`, `receipt`, `new-sale`. Risco de divergir. _Ação sugerida: extrair um único `PAYMENT_LABELS` compartilhado._
8. ⚠️ **6.8 — Datas: três formatadores `dateBR`/`formatDateBR`/`isoToBR`** em features diferentes (orders, whatsapp, sales/receipt, labels/dates). Verificar saída idêntica e considerar centralizar.
9. ⚠️ **6.9 — Estados vazio/erro:** auditar que **toda** lista (finanças, insumos, receitas, embalagens, precificação) usa `EmptyState` + tratamento de erro, não só as telas revisadas.
10. ⚠️ **6.10 — Acessibilidade:** auditar toque mínimo 48dp nos `Pressable` pequenos (ex: "Recebi" no Fiado, "Remover logo" no rótulo, chips de filtro) e contraste de texto sobre cards coloridos.

---

## 7. Roteiro de execução

1. **Automatizável agora (Vitest):** itens de domínio/formatação das seções 4.2/4.3 e 6.6–6.8 viram testes puros (formatadores, labels, máscaras) — já existem para datas/QR/recibo/fiado/telefone; estender para moeda e pagamento.
2. **Componente/Tela:** smoke tests dos formulários (validação obrigatória, máscara aplicada) onde houver RTL configurado.
3. **Manual em dev build (por release):** rodar a seção 5 tela a tela + módulos nativos (PDF/QR/notificação/WhatsApp) num build real (`npx expo run:android`/`eas build`), pois não rodam em Expo Go.
4. **Auditoria de coerência (pré-release):** percorrer a seção 4 inteira; tratar pendências da seção 6.

## 8. Manutenção

- Ao criar/alterar uma tela, **atualizar este documento** junto com o `ai.context.*.md` da feature.
- Toda nova incoerência detectada entra na **seção 6** com status (✅/⚠️) e ação sugerida.
