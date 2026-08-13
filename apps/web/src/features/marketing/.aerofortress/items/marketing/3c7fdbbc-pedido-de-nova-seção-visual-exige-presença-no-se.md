---
id: 3c7fdbbc-a766-46da-abd9-cf2a84b6297e
slug: marketing
type: scar
title: Pedido de nova seção visual exige presença no seletor, não só no prompt
tags: marketing, ui, seletor, variacoes, prompt, correcao
provenance: dito
evidence: correção da usuária em 2026-08-11; apps/api/src/features/marketing/marketing.system-prompt.ts
decay: stable
created: 2026-08-11T16:36:39.525627400+00:00
updated: 2026-08-11T16:36:39.525627400+00:00
validated: 2026-08-11T16:36:39.525627400+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): ao pedir uma nova seção com referência do seletor “Variações / Coerência com evolução”, implementar apenas o contrato interno da IA não atende — a opção precisa aparecer no seletor visível da interface. A primeira implementação adicionou “Tutorial editorial em passos” somente em marketing.system-prompt.ts e campaign-ai.ts, por isso a usuária não encontrou a seção na tela. COMO EVITAR: quando a referência mostra um conjunto de cards/opções e o pedido diz “nova seção”, localizar e alterar primeiro a fonte do seletor visível; depois conectar o valor selecionado ao contrato do backend.
