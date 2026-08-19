---
id: c8afc437-2943-4503-a930-f3dcf05bc623
slug: design
type: decision
title: Fornecedores usa overview real, PNG oficial e cadastro por presets
tags: suppliers, ui, pwa, mobile, purchases, svg, upload
provenance: observado
evidence: apps/mobile/src/features/suppliers/ai.context.mobile.md; apps/api/src/features/suppliers/ai.context.api.md; packages/database/src/migrations/061_supplier_management.sql; build PWA entry-5afb3dde845cf52b81fcf1421b341a7e.js; validação CDP final em .aerofortress/suppliers-*.png
decay: stable
created: 2026-08-19T01:39:32.292368400+00:00
updated: 2026-08-19T02:11:16.415245+00:00
validated: 2026-08-19T02:11:16.415245+00:00
links:
---

A tela canônica `/suppliers` é uma lista de coluna única com hero vinho, totais derivados de purchases, busca sem acentos, categorias, filtros combináveis e ordenação. Cadastro e edição reutilizam `SupplierForm` dentro de `StandardModal`; o formulário persiste categoria estável, contatos normalizados, descrição, preferência e avatar, invalida a query de fornecedores e restaura o foco ao fechar. A família local `supplier-illustration.tsx` contém 24 desenhos SVG com `viewBox` 0 0 48 48 e traço uniforme; `illustration-presets.ts` registra seis por categoria e o banco guarda somente o id. Upload ocorre apenas no submit pelo Supabase Storage existente, limita PNG/JPEG/WebP a 5 MB e confere a assinatura real dos bytes. A migration 061 é não destrutiva e dá a registros antigos categoria `other`, avatar `initials` e flags compatíveis. A auditoria final do bundle PWA `entry-5afb3dde845cf52b81fcf1421b341a7e.js` comprovou 320/360/375/390/412/768/1280 sem overflow, focus trap, Escape, restauração de foco e zero erros de console.
