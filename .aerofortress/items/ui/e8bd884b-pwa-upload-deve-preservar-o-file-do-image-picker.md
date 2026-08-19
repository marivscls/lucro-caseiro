---
id: e8bd884b-ecd2-4620-9384-69f64e3bfea1
slug: ui
type: scar
title: PWA: upload deve preservar o File do image picker, não depender da URL blob
tags: pwa, image-picker, upload, blob-url, file, catalogo, fornecedores, cross-realm
provenance: observado
evidence: apps/mobile/src/features/suppliers/components/supplier-form.tsx; apps/mobile/src/features/suppliers/components/supplier-form.test.tsx; apps/mobile/src/shared/utils/upload-image.ts; 14 testes direcionados passaram em 2026-08-19; bundle PWA entry-4f2cb76c24f8278c4b5b5fbd6667d808.js contém `e.file??void 0`
decay: stable
created: 2026-08-18T20:06:13.582103600+00:00
updated: 2026-08-19T11:47:32.913140+00:00
validated: 2026-08-19T11:47:32.913140+00:00
links: 
---

FALHAS CORRIGIDAS (2026-08-18 e 2026-08-19): o personalizador do Catálogo e o formulário de Fornecedores exibiam a imagem escolhida na prévia, mas não conseguiam enviá-la ao salvar. CAUSA BASE: expo-image-picker 17.0.11 no web retorna `uri` como URL blob e também entrega o `File`; o upload precisa preservar esse arquivo original e usar `arrayBuffer()`, não reler a URL temporária. CAUSA ADICIONAL EM FORNECEDORES: o formulário só aceitava o arquivo quando `asset.file instanceof Blob`; essa checagem falha para File/Blob de outro realm ou implementação compatível, descartando o arquivo e acionando o fallback quebrado por URL blob. CORREÇÃO: guardar `asset.file` diretamente (o contrato do picker já o tipa), usar `asset.uri` apenas para prévia e passar o arquivo ao uploader. COMO EVITAR: não use `instanceof Blob` como guarda de fronteira no PWA; preserve o File fornecido pelo picker e cubra com teste usando objeto File compatível que não herda do Blob global.
