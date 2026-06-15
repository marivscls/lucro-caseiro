# PRD — Melhorias de UI/UX (revisão geral de telas)

> Data: 2026-06-15 · Status: backlog priorizado (pré-implementação)
> Autor da revisão: varredura assistida das telas + princípios de UX do `CLAUDE.md`.

## Contexto

Após o redesign de várias telas (insumos, receitas, embalagens, produtos, precificação,
vendas, nova venda, home, agenda, insights), o app ficou **inconsistente**: parte das telas
segue o **padrão novo** e parte ainda usa o **padrão antigo**. Esta revisão lista, de forma
priorizada, o que falta para o app inteiro bater os próprios princípios de UX.

### Princípios de referência (do `CLAUDE.md`)

- Simplicidade radical: no máx. ~3 toques para a ação principal.
- Fontes mín. **16px**; alvos de toque **≥48×48dp**; **ícone sempre com texto**; contraste ≥4.5:1.
- Linguagem pt-BR simples, sem jargão. Público inclui idosos e jovens sem traquejo tech.

### O que é o "padrão novo" (referência: `materials.tsx`, `packaging.tsx`)

- Top bar própria: `←` voltar + título em negrito (26–28px) + ações à direita.
- Cards de resumo (métricas) no topo da lista.
- Cards de item ricos: avatar circular + badge colorido + info + stepper/menu funcional.
- Campos de formulário com **círculo de ícone** (`shared/components/form-field.tsx` → `TextFieldCard`, `FieldLabel`).
- Headers de modal padronizados (`←`/`×` + título), e botão de ação primário embaixo (altura ~56, ícone + texto).

### Legenda de prioridade

- **P0** — Acessibilidade (viola as regras do próprio app). Ganho rápido e transversal.
- **P1** — Consistência (telas no padrão antigo).
- **P2** — Simplicidade (fluxos sobrecarregados).
- **P3** — Polimento fino.

### Status das telas

| Padrão novo (ok)                                 | Padrão antigo / misto (a fazer)                  |
| ------------------------------------------------ | ------------------------------------------------ |
| materials, recipes, packaging, products, pricing | catalog, quotes, labels, plans                   |
| tabs/index (home), tabs/sales, tabs/new-sale     | tabs/clients (misto), tabs/more                  |
| agenda, insights, fiado                          | (auth) login, register, onboarding, settings     |
|                                                  | finance (wrapper — verificar `FinanceDashboard`) |

---

## P0 — Acessibilidade (quick wins, alto impacto)

> Corrigir antes de qualquer redesign maior: são pequenos e valem para o app todo.

1. **Tab bar com fonte 11px** — `app/tabs/_layout.tsx:31` (`tabBarLabelStyle.fontSize: 11`).
   → subir para **13–14px**. Verificar truncamento dos labels.
2. **Tab "Nova Venda" sem `title`** — `app/tabs/_layout.tsx:61` (`title: ""`).
   → definir `title: "Nova venda"` para leitor de tela (mantém o label visual oculto se for o caso).
3. **Tabela de Planos toda em `caption`** — `app/plans.tsx:157,161,180,183,187` (e larguras fixas 72/88).
   → usar `body`/`bodyBold` (≥16px) nos cabeçalhos e linhas; trocar largura fixa por flex.
4. **Regras de senha minúsculas** — `app/(auth)/register.tsx` (regras em `caption`, check ~10px, barra 4px).
   → texto ≥14px, check ≥16px, barra de força 6–8px; estado "ok" em negrito/verde.
5. **Seletor de nicho pequeno no onboarding** — `app/onboarding.tsx:249-250` (radio 30×30).
   → aumentar o alvo de toque para ≥48×48 (área tocável, não só o círculo).
6. **Botão "Editar" pequeno em Configurações** — `app/settings.tsx:235-236,342-343` (`pH:12 / pV:6` ≈ 24px alto).
   → `minHeight: 44–48` + `hitSlop`.
7. **Tipo de negócio "read-only" sem affordance** — `app/settings.tsx:584` (`editable={false}`).
   → virar um campo "toque para selecionar" com `chevron-down` + abrir o seletor de chips.
8. **FAB de Orçamentos só com ícone** — `app/quotes.tsx:462-485` (FAB `add` size 30, sem texto visível).
   → trocar pelo botão de ação inferior com **ícone + "Novo orçamento"** (padrão `materials.tsx`).
9. **Toggle mostrar/ocultar senha apertado** — `app/(auth)/login.tsx:205-223` (tem texto, mas pequeno e sobreposto, `position:absolute`).
   → aumentar alvo, garantir que não cobre o texto digitado, texto ≥14px. Replicar em `register.tsx`.
10. **"Voltar" do onboarding só ícone** — `app/onboarding.tsx:105` (`arrow-back` sem texto).
    → ok manter ícone se tiver `accessibilityLabel`, mas avaliar "Voltar" textual no fluxo de cadastro.

## P1 — Consistência (migrar telas antigas ao padrão novo)

> Cada item = aplicar top bar + cards de resumo + campos com ícone + header de modal padrão.

1. **Planos** (`app/plans.tsx`) — sem top bar; tabela comparativa frágil; CTA sem reforço de valor.
   → top bar "Planos"; tabela responsiva; destacar 3 benefícios + uso atual ("faltam X vendas").
2. **Orçamentos** (`app/quotes.tsx` + `features/quotes/components/quote-form.tsx`) — FAB ícone,
   modais só "Fechar", `Input` simples, sem resumo de total no form.
   → top bar + headers de modal com título; `TextFieldCard`; card fixo com **total** no editor.
3. **Rótulos** (`app/labels.tsx` + `create-label-form.tsx`) — modais sem título; form longo sem seções; `Input` simples.
   → headers de modal padrão; agrupar em seções ("Básico", "Datas", "Contato", "Marca"); `TextFieldCard`.
4. **Catálogo** (`app/catalog.tsx`) — sem top bar; sem estado inicial; paywall espalhado.
   → top bar; intro/estado inicial; seções premium com cadeado/badge em vez de alert surpresa.
5. **Mais opções** (`app/tabs/more.tsx`) — sem top bar; ícones 22px; padrão antigo de lista.
   → top bar + ícones 24px; alinhar itens ao estilo de card novo.
6. **Clientes** (`app/tabs/clients.tsx`) — misto: cores de ícone inconsistentes, FAB size 30, falta padding superior.
   → padronizar cores (textSecondary), FAB→botão inferior, `paddingTop` igual a sales/materials.
7. **Login/Cadastro** (`app/(auth)/login.tsx`, `register.tsx`) — `Input` simples; toggle de senha apertado.
   → campos com ícone; toggle maior; mensagens de erro claras ("E-mail inválido").
8. **Onboarding** (`app/onboarding.tsx`) — `Input` sem label; alvos pequenos; "Pular" minúsculo.
   → `FieldLabel`/`TextFieldCard`; alvos ≥48; "Pular por enquanto" em `body` com mais padding.
9. **Configurações** (`app/settings.tsx`) — misto: sem top bar; headers de modal só "Fechar".
   → top bar "Configurações"; headers de modal padrão; switches com `accessibilityLabel`.
10. **Financeiro** (`app/finance.tsx` → `FinanceDashboard`) — wrapper; verificar se o dashboard segue o padrão novo.

## P2 — Simplicidade (fluxos sobrecarregados)

1. **Detalhe do orçamento** (`features/quotes/components/...` / `quotes.tsx:312-364`) — 6–7 botões.
   → eleger **1 ação primária** (WhatsApp ou "Criar pedido"); mover Editar/Rejeitar/Excluir para menu "⋯".
2. **Catálogo abre form complexo de cara** (`app/catalog.tsx`) — capa, cores, padrões, premium juntos.
   → estado inicial leve ("Ativar catálogo") e revelar opções progressivamente.

## P3 — Polimento fino

1. **Mismatch ícone/texto** — vendas/agenda/more (ícone 22–26px com texto 14–16px) → padronizar 20–24px.
2. **Chevron `up` confuso** na agenda (card de resumo) → `chevron-down` (colapsável) ou `forward`.
3. **Feedback de toque** ausente em alguns seletores (insights) → `opacity` no `pressed`.
4. **Padding de scroll** no fim de listas (insights) → buffer extra acima do tab bar.
5. **Contraste de badges** com `primaryLight` em fundo claro (sales/clients) → auditar WCAG AA.

---

## Ordem sugerida de execução

1. **Fase 1 (P0):** varredura de acessibilidade — 1 commit por tema (fontes, alvos de toque, ícones/labels).
2. **Fase 2 (P1):** padronizar telas antigas, 1 commit por tela, reusando `form-field.tsx` e o padrão de top bar.
3. **Fase 3 (P2):** simplificar detalhe de orçamento e entrada do catálogo.
4. **Fase 4 (P3):** polimentos transversais.

## Checklist para migrar uma tela ao padrão novo

- [ ] Top bar própria (`←` + título negrito + ações) e `Stack.Screen headerShown:false`.
- [ ] Cards de resumo quando fizer sentido (métricas no topo).
- [ ] Cards de item com avatar/badge; nenhum ícone "morto" (todo ícone tocável faz algo).
- [ ] Campos via `TextFieldCard`/`FieldLabel`; nada de fonte <16px.
- [ ] Headers de modal padronizados; botão primário inferior (ícone + texto, ~56px).
- [ ] Alvos ≥48×48; `accessibilityRole`/`accessibilityLabel` em tudo que toca.
- [ ] Atualizar `ai.context.mobile.md` da feature + rodar `pnpm context:lint`.

## Observação importante (dado de backend ausente)

Em **Embalagens**, os mockups previam "usado em X produtos" e "histórico de uso", mas o backend
não expõe esse dado hoje (contrato `Product` não referencia packaging; `Packaging` não traz contagem).
Foi **omitido** para não inventar números. Se for prioridade, abrir tarefa separada de backend
(endpoint de uso + query no join `packaging↔products`).
