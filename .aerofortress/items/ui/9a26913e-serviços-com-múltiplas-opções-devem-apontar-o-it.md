---
id: 9a26913e-fe67-4c30-ae70-862ebcbfcd13
slug: ui
type: scar
title: Serviços com múltiplas opções devem apontar o item e o campo incompletos
tags: servicos, formulario, validacao, opcoes, adicionais, pacotes, erro-inline
provenance: dito
evidence: Relato e captura da usuária em 2026-07-31; apps/mobile/src/features/services/components/service-form.tsx; apps/mobile/src/features/services/domain.ts; apps/mobile/src/features/services/domain.test.ts; teste direcionado, typecheck e lint mobile aprovados
decay: stable
created: 2026-07-31T17:07:04.410899300+00:00
updated: 2026-07-31T17:07:04.410899300+00:00
validated: 2026-07-31T17:07:04.410899300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-31): ao cadastrar um serviço com mais de uma opção, adicional ou pacote, a ausência de um campo impedia o cadastro e mostrava apenas o alerta genérico “Revise nomes, durações e valores...”, sem dizer onde estava o problema. CORREÇÃO: a validação percorre os itens na ordem, identifica tipo, posição e campo inválido, exibe mensagem específica (ex.: “Informe um preço maior que zero para a opção 2”) e marca o Input correspondente; os limites numéricos também espelham o contrato da API. COMO EVITAR: listas dinâmicas em formulários nunca devem colapsar erros de vários itens em uma mensagem genérica; preserve índice e campo da primeira falha e mostre-os junto ao controle.
