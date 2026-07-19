---
id: d765498a-e9eb-436d-a856-72e5df408f80
slug: ui
type: scar
title: Avatar do shell desktop deve usar a foto salva do perfil
tags: desktop, sidebar, avatar, perfil, foto, fallback
provenance: observado
evidence: apps/mobile/src/shared/components/desktop-shell.tsx; captura da usuária em 2026-07-19; eslint e Prettier do arquivo aprovados; build:pwa:caseiro aprovado
decay: stable
created: 2026-07-19T04:36:55.603957800+00:00
updated: 2026-07-19T04:36:55.603957800+00:00
validated: 2026-07-19T04:36:55.603957800+00:00
links:
---

SINTOMA (2026-07-19): a área da conta na sidebar desktop mostrava sempre a inicial do nome, mesmo quando o perfil tinha foto. CAUSA: `DesktopShell` consultava `useProfile()`, mas o círculo renderizava a inicial incondicionalmente e ignorava `profile.avatarUrl`. CORREÇÃO: renderizar `Image` com `profile.avatarUrl` quando presente e manter a inicial somente como fallback. COMO EVITAR: todo avatar de conta que já recebe `UserProfile` deve respeitar a prioridade foto salva > inicial, incluindo shells e cabeçalhos responsivos.
