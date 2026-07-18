# PRD — Melhorias pré-lançamento (auditoria 2026-07-11)

**Status:** aprovado pela dona do produto em 2026-07-11 · **Origem:** auditoria completa de produto/monetização/growth/design (4 frentes)

> **Posicionamento atualizado em 2026-07-16:** o público abaixo registra o recorte de aquisição do pré-lançamento, não o limite do produto. O Lucro Caseiro atende de profissionais autônomos a negócios estruturados e em crescimento; segmentos caseiros são exemplos de entrada.

## Contexto

O Lucro Caseiro está às vésperas do lançamento nas lojas (billing 3 tiers no ar, build de produção gerada). A auditoria concluiu que o produto (17 features verticais) está mais maduro que a máquina de conversão e aquisição. Este PRD consolida as correções aprovadas.

**Público:** microempreendedoras de negócios caseiros no Brasil (confeitaria, artesanato, marmitas), incluindo idosas e pessoas sem experiência tech. **Princípio inviolável:** simplicidade radical, máx. 3 toques. **Canal natural:** WhatsApp.

## Fase 1 — nesta rodada (aprovado, em implementação)

### F1. Riscos de lançamento

| #   | Item                                                  | Solução                                                                                                                                                |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | "Cancelar assinatura" morto (`plans.tsx:324`)         | Deep-link de gerenciamento de assinatura da loja (Play/App Store); fallback suporte.                                                                   |
| 1.2 | Push remoto morto (POST `/users/push-token` → 404)    | Remover o código morto; notificações continuam locais. Ver ADR-0004.                                                                                   |
| 1.3 | Features pagas sem gate (compras de fornecedor, kits) | Verificar e adicionar `showPaywall` nos pontos de entrada. Regra da scar: recurso 100 %-premium mostra tela de apresentação + CTA, nunca o formulário. |

### F2. Monetização

| #   | Item                                               | Solução                                                                                                                                                               |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Essencial sem diferencial qualitativo              | Nova feature `exportBasic`: exportar resumo mensal em PDF simples, disponível no Essencial. `export` completo (XLSX + avançados) segue no Profissional. Ver ADR-0005. |
| 2.2 | Teto de 3 fornecedores do Essencial não comunicado | Comunicar explicitamente na tela de planos, antes da compra.                                                                                                          |
| 2.3 | Paywall sem técnica de venda                       | Anual pré-selecionado + badge "mais vantajoso" + âncora "equivale a R$ X/mês · economize R$ Y".                                                                       |
| 2.4 | Downgrade silencioso ao expirar                    | Aviso in-app quando a assinatura expirou/está por expirar (sem backend novo: derivado de `expiresAt`).                                                                |
| 2.5 | AdBanner ao lado do LimitBanner na home            | Ocultar o AdBanner quando o LimitBanner estiver visível.                                                                                                              |

### F3. Growth

| #   | Item                                    | Solução                                                                                                                     |
| --- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | PDFs sem marca                          | Footer "Feito com Lucro Caseiro" + link nos PDFs de orçamento, recibo, rótulo e receita (mesmo padrão do catálogo público). |
| 3.2 | Footer do catálogo público não clicável | Virar CTA "Crie sua vitrine grátis" com link.                                                                               |
| 3.3 | App nunca pede avaliação na loja        | `expo-store-review` disparado após a 3ª venda registrada (momento de sucesso; 1x, nunca repetir se já avaliou/recusou).     |
| 3.4 | Sem landing page                        | Página estática mínima em docs/ (mesmo hosting das páginas legais): proposta de valor, screenshots, links das lojas.        |

### F4. Produto/UX

| #   | Item                                         | Solução                                                                                                                                         |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Agenda/Financeiro/Fiado enterrados no "Mais" | Agenda vira tab no lugar de Clientes; Clientes vai pro "Mais" (segue na home). Financeiro/Fiado destacados no topo do "Mais". Ver ADR-0006.     |
| 4.2 | Encomenda sem cliente/observações            | Expor `notes` e `clientId` (já existem no contrato) no formulário de encomenda.                                                                 |
| 4.3 | Empty states ausentes                        | Adicionar em clientes, compras, embalagens, insights e rótulos usando o `EmptyState` do design system: 1 frase simples + CTA do primeiro passo. |

### F5. Design

| #   | Item                    | Solução                                                                                                         |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| 5.1 | Duas linguagens visuais | Migrar Vendas, Planos e Catálogo pro padrão flat+borda da home; token de sombra no design system. Ver ADR-0007. |
| 5.2 | Fontes < 16 px          | Corrigir ocorrências (home, paywall, clientes, tab bar) pro mínimo do guia.                                     |
| 5.3 | Higiene de tokens       | Hex hardcoded → tokens (fiado, gastos recorrentes); `Card` variant `elevated` com sombra real.                  |

**Restrições de design (scars):** sem ícones de brilhos/decorativos; Android: nunca `elevation` + fundo translúcido; alertas sempre via `showAlert`/`confirm` temáticos; recurso 100 %-premium nunca mostra formulário pra conta free.

## Fase 2 — especificado, não implementar agora

- **Precificação guiada** (a feature central hoje exige ~5 passos em 3 telas: insumos → receita → calculadora). Proposta: assistente passo-a-passo único ("Quanto cobrar?"), UM passo por tela — **não** uma tela única — no mesmo padrão do wizard de Nova Venda. Merece sessão dedicada com validação visual; risco alto demais pra véspera de lançamento.
- **Winback/oferta de retenção** no fluxo de cancelamento (exige infra de ofertas nas lojas).

## Futuro (registrado, sem compromisso)

- **Programa de indicação** ("indique uma amiga, ganhe 1 mês"): maior buraco de growth orgânico pro canal WhatsApp, mas adiado pela dona do produto — app ainda não lançou; reavaliar com base instalada.
- Resumo diário/semanal via push do servidor (exige infra de push remoto — ver ADR-0004).
- Deep link do catálogo público ("abrir no app").

## Métricas de sucesso (pós-lançamento)

- Conversão free→pago e mix mensal/anual (esperado: anual sobe com âncora + default).
- Avaliações na loja (esperado: volume orgânico via store review após 3ª venda).
- Instalações vindas do link do catálogo/PDFs (UTM no link do footer).
- Zero tickets de "não consigo cancelar".
