---
id: 2468b1cf-5280-417c-a7e8-7f066da3700a
slug: ui
type: scar
title: Detalhe em modal deve ser desmontado junto com o registro selecionado
tags: modal, orcamentos, vendas, agenda, fornecedores, receitas, embalagens, pwa, desktop, fechamento, estado, react-native-web, componente-compartilhado
provenance: observado
evidence: apps/mobile/src/shared/components/standard-modal.tsx; apps/mobile/src/app/quotes.tsx; apps/mobile/src/app/tabs/sales.tsx; apps/mobile/src/app/tabs/agenda.tsx; apps/mobile/src/app/suppliers.tsx; apps/mobile/src/app/recipes.tsx; apps/mobile/src/app/packaging.tsx; capturas da usuária em 2026-07-19; lint dos arquivos, 340 testes mobile, typecheck mobile e build:pwa:caseiro aprovados
decay: stable
created: 2026-07-19T04:15:24.367162400+00:00
updated: 2026-07-19T20:55:28.653968400+00:00
validated: 2026-07-19T20:55:28.653968400+00:00
links:
---

SINTOMA (2026-07-19): ao fechar detalhes no PWA desktop, o conteúdo sumia, mas a superfície e o backdrop do modal permaneciam abertos apenas com o título genérico. O problema apareceu em Orçamentos, Vendas, Agenda, Fornecedores, Receitas e Embalagens. CAUSA: o ID/registro selecionado era limpo antes de o Modal terminar seu ciclo de fechamento; o `StandardModal` continuava montado com `visible={false}` enquanto os dados/filhos já haviam desaparecido. CORREÇÃO CANÔNICA: `StandardModal` retorna `null` quando `visible` é falso, impedindo globalmente qualquer superfície residual. Nos detalhes dependentes de seleção, renderizar também o modal condicionalmente junto com o registro/ID não nulo e usar `visible` constante enquanto montado. COMO EVITAR: modais cujo conteúdo depende de um registro selecionado não permanecem montados com título fallback e corpo vazio durante o fechamento; a proteção pertence ao componente compartilhado e a associação registro-modal fica explícita na tela.
