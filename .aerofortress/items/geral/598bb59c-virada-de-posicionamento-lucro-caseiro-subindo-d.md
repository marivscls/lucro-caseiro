---
id: 598bb59c-8633-4a42-97f9-092e22af8e7d
slug: geral
type: decision
title: Virada de posicionamento: Lucro Caseiro subindo de nível (mais que negócio caseiro) + aba Fornecedores
tags: produto, visao, fornecedores, fluxo-de-caixa, finance
provenance: dito
evidence: 
decay: stable
created: 2026-06-25T12:37:28.137193300+00:00
updated: 2026-06-25T12:37:28.137193300+00:00
validated: 2026-06-25T12:37:28.137193300+00:00
links: 
---

A dona do produto decidiu **expandir o Lucro Caseiro além do nicho "negócio caseiro"**, mirando um produto mais completo/profissional ("tornar premium"). Duas decisões concretas desta conversa:

1. **Aba/feature de Fornecedores** vai existir como cadastro próprio (entidade), não só o campo de texto livre `supplier` que hoje existe em ingredientes (`ingredients.ts:19`) e embalagens. A dona considera importante — decisão tomada mesmo após eu recomendar a versão enxuta (autocomplete em vez de aba). **Override meu: construir a aba.**
2. **Fluxo de caixa**: expandir a feature `finance` (hoje livro-caixa mensal) para fluxo de caixa de verdade — venda alimentando o caixa automaticamente (`Finance.createFromSale` já existe mas NÃO é chamado por sales), saldo acumulado, e contas a pagar/receber.

Tensão a respeitar ao construir: o princípio #1 de UX (simplicidade radical, máx. 3 toques, público inclui idosos) continua valendo — subir de nível não pode inchar a navegação. Relacionado: [[business-tier-future]] (tier empresarial parado por falta de valor distinto — essa expansão pode ser o valor).
