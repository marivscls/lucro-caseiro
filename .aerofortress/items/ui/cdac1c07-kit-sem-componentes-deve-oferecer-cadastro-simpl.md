---
id: cdac1c07-df42-4047-b432-42166d06f110
slug: ui
type: scar
title: Kit sem componentes deve oferecer cadastro simples com retorno ao rascunho
tags: produto-composto, kit, estado-vazio, modal, rascunho, mobile, rodape, responsividade
provenance: dito
evidence: apps/mobile/src/features/products/components/component-picker.tsx; apps/mobile/src/features/products/components/create-product-form.tsx; capturas enviadas pela usuária em 2026-08-13; ESLint e typecheck aprovados; bundle HTTP da porta 8083 contém o rodapé responsivo
decay: stable
created: 2026-08-13T21:48:26.551880100+00:00
updated: 2026-08-13T21:56:44.302443900+00:00
validated: 2026-08-13T21:56:44.302443900+00:00
links:
---

SINTOMA (2026-08-13): no cadastro de produto composto, quando não havia produtos simples, o seletor mostrava apenas a orientação e o botão “Concluir”, encerrando o modal sem levar a uma ação possível. PRIMEIRA CORREÇÃO: o estado vazio passou a oferecer “Cadastrar produto simples”; o cadastro abre como etapa interna, mantém o rascunho do kit, oferece “Voltar ao kit” e inclui o novo produto na quantidade 1. RECORRÊNCIA/CORREÇÃO DA USUÁRIA: no celular, “Voltar ao kit” e “Cadastrar produto” foram mantidos lado a lado; o CTA primário ficou apertado e truncado. CORREÇÃO CANÔNICA: o rodapé fica lado a lado apenas no desktop; no mobile, as ações são empilhadas com largura total, retorno acima e cadastro abaixo. COMO EVITAR: dependências vazias em formulários compostos precisam de criação contextual com estado preservado; rodapés móveis com dois rótulos textuais longos não dividem uma única linha.
