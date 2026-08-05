---
id: 55464bc5-b284-4ea1-8cea-5981eef00441
slug: ui
type: scar
title: Selo do nome do negócio não deve quebrar linha no cartão de perfil
tags: mobile, settings, badge, quebra-de-linha, font-scale, perfil
provenance: observado
evidence: Captura enviada pela usuária em 2026-08-04; apps/mobile/src/app/settings.tsx; packages/ui/src/components/badge.tsx
decay: stable
created: 2026-08-04T11:14:27.686962600+00:00
updated: 2026-08-04T11:14:27.686962600+00:00
validated: 2026-08-04T11:14:27.686962600+00:00
links:
---

SINTOMA (2026-08-04, captura da usuária): em Configurações, o Badge neutro de `Delicias da Mariana` quebrou em duas linhas porque o botão textual `Editar perfil` consumia a largura do cartão móvel. CORREÇÃO IMPLEMENTADA: no layout compacto, manter o botão como ícone de 44 px com `accessibilityLabel`, reservar o rótulo textual para desktop e permitir que o Badge receba `numberOfLines={1}` com `maxWidth: "100%"`; assim o nome fica em uma linha e só trunca em larguras extremas. COMO EVITAR: em cabeçalhos móveis com avatar + conteúdo flexível + ação, ações secundárias devem ser compactas e textos de selo que identificam o negócio não devem quebrar. Validação automatizada: typecheck de UI/mobile e ESLint direcionado passaram; validação visual autenticada ainda não foi executada.
