---
id: 30a910e3-b80e-44f4-abe6-609cca306749
slug: compliance
type: scar
title: Rótulo publicado não pode chamar tabela simplificada de informação nutricional
tags: etiquetas, rotulos, anvisa, escopo, produto, api, corrigido
provenance: observado
evidence: apps/mobile/src/features/labels/components/create-label-form.tsx; apps/mobile/src/features/labels/components/label-preview.tsx; apps/mobile/src/features/labels/label-export.ts; apps/api/src/features/labels/labels.domain.ts; apps/api/src/features/labels/labels.usecases.ts; docs/terms.html; 338 testes mobile, 43 testes API, lint, typechecks e build:pwa:caseiro aprovados em 2026-07-19
decay: stable
created: 2026-07-19T16:49:53.415767300+00:00
updated: 2026-07-19T20:38:31.552354800+00:00
validated: 2026-07-19T20:38:31.552354800+00:00
links:
---

SINTOMA OBSERVADO (2026-07-19): a versão pública 1.2.0/versionCode 19 anunciava etiquetas e imprimia um bloco chamado “Informação nutricional” com campos livres e incompletos, criando aparência de rotulagem técnica sem sustentação. A primeira correção ampliou o app para tentar reproduzir RDC 727/2022, RDC 429/2020 e IN 75/2020, mas a usuária corrigiu o próprio escopo: a dor é substituir o papel adesivo escrito à mão, não gerar rótulo industrial.

CORREÇÃO CANÔNICA (2026-07-19): a feature passou a se chamar Etiquetas e imprime somente nome do produto, observação, datas opcionais, contato, logo e QR opcional. Campos nutricionais/regulatórios foram removidos da criação, edição, preview e PDF; o contrato antigo permanece apenas para compatibilidade. A API aplica `toSimpleLabelData` nas entradas e saídas, de modo que clientes antigos também não persistam nem recebam o payload técnico após o backend atualizado. O export avisa que a etiqueta de identificação não substitui rotulagem obrigatória quando aplicável.

REGRA DURÁVEL: o Lucro Caseiro não deve oferecer ou prometer gerador de rotulagem sanitária. Etiquetas resolvem identificação e impressão; eventual rótulo técnico completo é outro produto e exige demanda e validação profissional.
