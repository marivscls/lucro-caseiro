---
id: 9db802b1-8227-413b-a4e1-10bb99dabf6c
slug: ui
type: scar
title: Auditoria de alterações recentes não pode ser reduzida à tela da conversa
tags: ui, modo-escuro, auditoria, escopo, diff, correcao
provenance: dito
evidence: Correção explícita da usuária nesta conversa em 2026-07-25: “lembrando que nao so as altaracoes do checkout, ok?”
decay: stable
created: 2026-07-26T02:06:43.584752500+00:00
updated: 2026-07-26T02:06:43.584752500+00:00
validated: 2026-07-26T02:06:43.584752500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): ao pedir para verificar se TODAS as últimas alterações foram adaptadas ao modo escuro, a auditoria foi indevidamente limitada ao checkout porque essa era a tela em foco na conversa. ESCOPO CORRETO: “todas as últimas alterações” significa inventariar todas as mudanças recentes de interface no estado atual do app e revisar tela por tela e componente por componente; a tela em foco é apenas um item. COMO EVITAR: antes de encerrar uma auditoria global, derivar o inventário real do diff/status, classificar todos os arquivos de UI alterados e prestar contas de cada grupo, sem inferir escopo estreito apenas pelo contexto visual imediato.
