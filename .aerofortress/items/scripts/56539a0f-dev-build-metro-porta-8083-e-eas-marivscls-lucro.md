---
id: 56539a0f-052b-4798-83f4-7277d13b4328
slug: scripts
type: fact
title: Dev build + Metro: porta 8083 e EAS @marivscls/lucro-caseiro
tags: expo, eas, development-build, android, metro
provenance: observado
evidence: Saída de `pnpm exec eas whoami`, `pnpm exec eas project:info`, `pnpm exec eas build ...` e `pnpm exec eas build:view 34e15e85-42e4-4f29-b49a-07e1510aaa86 --json` em 2026-08-13; apps/mobile/eas.json; apps/mobile/package.json
decay: seasonal
created: 2026-06-26T12:41:07.397607100+00:00
updated: 2026-08-13T17:04:17.826344+00:00
validated: 2026-08-13T17:04:17.826344+00:00
links:
---

Para testar no aparelho físico com dev client:

1. **Build**: em `apps/mobile`, executar `pnpm exec eas build --profile development --platform android --non-interactive --no-wait`. A sessão EAS observada em 2026-08-13 é `marivscls` (marianadosreisvasconcelos7@gmail.com), e a configuração atual resolve o projeto `@marivscls/lucro-caseiro` (ID `a64ae465-7911-4d82-81a3-9f2d20973dff`). O perfil `development` usa dev client, distribuição interna e APK.
2. **Metro**: `cd apps/mobile && pnpm dev` roda `expo start --port 8083`, conforme `apps/mobile/package.json`.
3. **Conectar**: no dev client, usar a URL do Metro na porta 8083; celular e PC precisam conseguir alcançar a mesma rede.

Build development disparado em 2026-08-13: ID `34e15e85-42e4-4f29-b49a-07e1510aaa86`, Android, versão 1.2.0, buildVersion 24, status inicial `IN_QUEUE`.
