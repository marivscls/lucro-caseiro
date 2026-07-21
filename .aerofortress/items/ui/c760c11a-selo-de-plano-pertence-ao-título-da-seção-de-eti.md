---
id: c760c11a-ca29-4d16-a9d0-ad3e91a90b58
slug: ui
type: scar
title: Selo de plano pertence ao título da seção de etiquetas
tags: labels, ui, premium, forms
provenance: dito
evidence: apps/mobile/src/shared/components/form-section.tsx; apps/mobile/src/features/labels/components/label-layout-editor.tsx
decay: stable
created: 2026-07-21T12:25:01.664505300+00:00
updated: 2026-07-21T12:25:01.664505300+00:00
validated: 2026-07-21T12:25:01.664505300+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-21): no bloco “Formato de impressão”, o selo “Profissional” não deve competir com o texto explicativo dentro do conteúdo; deve aparecer na mesma linha do título da seção. O campo de quantidade também precisa nomear diretamente a intenção como “Número de cópias por folha A4”, em vez de “Etiquetas por folha A4”. Para evitar uma composição paralela, o `FormSection` canônico aceita um `titleAccessory`.
