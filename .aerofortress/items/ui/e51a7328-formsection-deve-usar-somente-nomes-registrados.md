---
id: e51a7328-5553-4b1f-8064-f6757768dce0
slug: ui
type: scar
title: FormSection deve usar somente nomes registrados no AppIcon
tags: app-icon, typescript, form-section, mobile, typecheck
provenance: observado
evidence: apps/mobile/src/features/labels/components/create-label-form.tsx; apps/mobile/src/app/labels.tsx; typecheck do mobile falhou e passou após usar grid-outline em 2026-07-20
decay: stable
created: 2026-07-21T02:20:37.687113900+00:00
updated: 2026-07-21T02:20:37.687113900+00:00
validated: 2026-07-21T02:20:37.687113900+00:00
links:
---

SINTOMA (2026-07-20): o typecheck do mobile falhou ao adicionar `icon="print-outline"` em FormSection porque esse nome não existe no mapa tipado do AppIcon. CORREÇÃO: consultar `apps/mobile/src/shared/components/app-icon.tsx` e reutilizar um ícone registrado; para o formato de etiquetas foi usado `grid-outline`. COMO EVITAR: antes de usar um nome Ionicons por memória em componentes tipados, confirmar que ele está no mapa canônico AppIcon; um nome válido na biblioteca original pode não estar exposto pelo app.
