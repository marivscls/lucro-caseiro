---
id: 3ba04df1-4e44-499c-afae-bd01360baa41
slug: ui
type: scar
title: Documentos: alinhar Anexar, MD e PDF sem aumentar os botões
tags: ui, documentos, correcao-visual, alinhamento
provenance: dito
evidence: apps/web/src/app/globals.css
decay: stable
created: 2026-07-17T00:25:33.810372900+00:00
updated: 2026-07-17T00:35:50.337749600+00:00
validated: 2026-07-17T00:35:50.337749600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-16): os controles Anexar, MD e PDF devem manter o mesmo tamanho de 88×36px e ficar alinhados verticalmente; não aumentar a altura para tentar alcançar a borda do Anexar. SINTOMA: Anexar aparecia 15px abaixo de MD/PDF. CAUSA REAL: a regra global `label { margin: 15px 0; }` atingia o label de upload, mas não os elementos button de MD/PDF. CORREÇÃO CANÔNICA: a classe local `.document-file-action`, usada nos três controles, define `width: 88px`, `height: 36px`, `flex: 0 0 88px` e `margin: 15px 0`; assim MD/PDF descem até a mesma posição do Anexar sem mudar o tamanho. COMO EVITAR: antes de alterar dimensões, verificar estilos globais específicos do tipo de elemento quando controles equivalentes misturam `label` e `button`.
