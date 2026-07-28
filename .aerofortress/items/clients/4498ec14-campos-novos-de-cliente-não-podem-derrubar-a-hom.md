---
id: 4498ec14-b9cd-4faf-8227-0c8a2409bbfb
slug: clients
type: scar
title: Campos novos de cliente não podem derrubar a Home antes da API publicada
tags: clientes, pwa, compatibilidade, api, migration, tela-branca, nextContactAt, boundary
provenance: observado
evidence: apps/mobile/src/features/clients/api.ts; apps/mobile/src/features/clients/api.test.ts; .aerofortress/tmp/live-chrome-8084.stdout.log; .aerofortress/tmp/chrome-live-fixed-8084.png
decay: stable
created: 2026-07-25T03:44:20.102328900+00:00
updated: 2026-07-25T03:44:20.102328900+00:00
validated: 2026-07-25T03:44:20.102328900+00:00
links:
---

SINTOMA (2026-07-25): após o PRD adicionar “próximo contato”, a conta autenticada abria a PWA em branco, enquanto perfis sem sessão mostravam o login. O console do perfil real revelou `Cannot read properties of undefined (reading 'slice')` em `dueContacts`: a Home chamava `client.nextContactAt.slice(...)`, mas a API publicada antes da migration 043 ainda omitia `nextContactAt`, `nextContactReason` e `nextContactNotes`.

CAUSA: o mobile foi compilado com o contrato novo e usado contra a API externa antiga. O tipo declarava os campos como `string | null`, mas a fronteira HTTP apenas fazia cast de JSON; em runtime eles eram `undefined`. A implementação anterior validou com respostas simuladas já atualizadas e não cobriu a versão anterior da API.

CORREÇÃO: `apps/mobile/src/features/clients/api.ts` agora normaliza respostas antigas na fronteira, convertendo os três campos ausentes para `null` em listagem, detalhe, aniversários, criação e edição. Um teste reproduz explicitamente o payload legado. Após rebuild, o mesmo Chrome autenticado montou `/tabs` com `rootLength` 64839, dados reais e zero erros.

COMO EVITAR: toda UI implantada antes ou separadamente da API/migration precisa aceitar o payload anterior na fronteira de rede; mocks de auditoria devem incluir o contrato legado. Não espalhar checks de `undefined` em componentes quando o contrato interno é nullable — normalize uma vez na API. Para mudanças incompatíveis, publicar banco/API antes da UI ou manter compatibilidade de leitura até a implantação conjunta.
