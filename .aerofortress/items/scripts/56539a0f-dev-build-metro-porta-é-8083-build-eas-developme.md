---
id: 56539a0f-052b-4798-83f4-7277d13b4328
slug: scripts
type: fact
title: Dev build + Metro: porta é 8083, build EAS development como marivscls5
tags: expo, metro, dev-client, android
provenance: observado
evidence: apps/mobile/package.json; processo Expo observado em 2026-07-14: expo start --port 8083; Test-NetConnection 192.168.1.7:8083 = True
decay: seasonal
created: 2026-06-26T12:41:07.397607100+00:00
updated: 2026-07-14T12:06:20.830495900+00:00
validated: 2026-07-14T12:06:20.830495900+00:00
links: 
---

Para testar no aparelho físico com dev client:

1. **Build**: de `apps/mobile`, `eas build --profile development --platform android --non-interactive --no-wait` (conta **marivscls5** / vasconcelosmariana05@gmail.com; projeto EAS **lucro-caseiro-dev**). Perfil `development` = dev client + APK.
2. **Metro**: `cd apps/mobile && pnpm dev` roda `expo start --port 8083`, conforme o script atual do `apps/mobile/package.json`.
3. **Conectar**: no dev client → "Enter URL manually" → `http://<IP_LAN_DO_PC>:8083`. O IP muda ao reconectar; conferir antes. Celular e PC precisam estar no mesmo Wi‑Fi. Em 2026-07-14, o IP observado foi `192.168.1.7` e o Metro do projeto estava escutando em `192.168.1.7:8083`.
