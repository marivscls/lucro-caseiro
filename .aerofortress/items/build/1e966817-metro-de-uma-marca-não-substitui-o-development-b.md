---
id: 1e966817-90eb-41bb-8809-495478d3681b
slug: build
type: scar
title: Metro de uma marca não substitui o development build separado no celular
tags: expo, eas, android, whitelabel, development-build
provenance: dito
evidence:
decay: stable
created: 2026-07-19T16:37:29.789446300+00:00
updated: 2026-07-19T16:37:29.789446300+00:00
validated: 2026-07-19T16:37:29.789446300+00:00
links:
---

SINTOMA (2026-07-19): ao pedir para subir o Expo do Lucro na Papelaria para testar no celular, foi iniciado apenas um Metro com o bundle da marca e informado que bastava conectar usando o development build existente. A usuária corrigiu que a Papelaria deveria ser um app separado.

COMO EVITAR: para testar uma marca whitelabel no aparelho, primeiro confirmar/gerar e instalar o development build do perfil específico da marca (`papelaria-development`), com package/bundle identifier próprios; só então iniciar o Metro com a mesma marca. Um Metro separado escolhe o bundle JavaScript, mas não cria nem instala um aplicativo nativo separado. Validar ambos: artefato EAS da marca + servidor Metro da mesma marca.
