---
id: e411a573-c0af-4b87-b5dd-eef19eea26c4
slug: ui
type: scar
title: Seletor de modo da Precificação é compacto, horizontal e elegante
tags: precificacao, seletor, botoes, tipografia, responsividade, icone, espacamento, referencia-visual
provenance: dito
evidence: Correções e referência visual da usuária em 2026-07-25; apps/mobile/src/features/pricing/components/pricing-mode-switch.tsx
decay: stable
created: 2026-07-25T20:18:33.324819400+00:00
updated: 2026-07-25T21:38:25.810448900+00:00
validated: 2026-07-25T21:38:25.810448900+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-25): (1) a primeira reprodução do seletor `Simples`/`Completa` ficou grande e sem respiro entre os botões; (2) título e subtítulo em duas linhas deixaram o controle alto; (3) o ícone de brilho do modo Simples precisava primeiro de traço mais fino e, na correção visual seguinte, foi removido por completo; (4) o seletor estava grudado no título `Precificação` e precisava descer; (5) a nomenclatura longa `Simples · Rápido e prático` / `Completa · Profissional` foi substituída por somente `Simples` / `Avançado`. CORREÇÃO CANÔNICA MAIS RECENTE: manter o controle segmentado horizontal com gap, altura fixa de 48 px e apenas um rótulo curto por opção (`Simples` / `Avançado`), sem descrição auxiliar; não exibir ícone de brilho no botão Simples; separar o seletor do cabeçalho com `marginTop: spacing.lg` (16 px). COMO EVITAR: esse seletor deve parecer um controle segmentado compacto, não dois cards; não empilhar textos, não reintroduzir as descrições antigas, não voltar a usar `Completa` e não encostar o controle no cabeçalho.
