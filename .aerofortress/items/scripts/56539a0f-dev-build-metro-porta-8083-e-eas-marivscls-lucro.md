---
id: 56539a0f-052b-4798-83f4-7277d13b4328
slug: scripts
type: fact
title: Dev build + Metro: porta 8083 e EAS @marivscls/lucro-caseiro
tags: eas, android, development-build, metro
provenance: observado
evidence: EAS build 90414e01-4265-4f96-b23e-9f8ceb359c1c — https://expo.dev/accounts/marivscls/projects/lucro-caseiro/builds/90414e01-4265-4f96-b23e-9f8ceb359c1c
decay: seasonal
created: 2026-06-26T12:41:07.397607100+00:00
updated: 2026-08-31T12:42:30.003641+00:00
validated: 2026-08-31T12:42:30.003641+00:00
links: 
---

Para testar no aparelho físico com dev client:

1. **Build**: em `apps/mobile`, executar `pnpm exec eas build --profile development --platform android --non-interactive --no-wait`. A sessão EAS observada é `marivscls`, e a configuração resolve o projeto `@marivscls/lucro-caseiro` (ID `a64ae465-7911-4d82-81a3-9f2d20973dff`). O perfil `development` usa dev client, distribuição interna e APK.
2. **Metro**: `cd apps/mobile && pnpm dev` roda `expo start --port 8083`, conforme `apps/mobile/package.json`.
3. **Conectar**: no dev client, usar a URL do Metro na porta 8083; celular e PC precisam conseguir alcançar a mesma rede.

Build development mais recente disparado em 2026-08-31: ID `90414e01-4265-4f96-b23e-9f8ceb359c1c`, Android, versão 1.2.0, buildVersion 26, status inicial `IN_QUEUE`.
