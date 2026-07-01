---
id: 56539a0f-052b-4798-83f4-7277d13b4328
slug: scripts
type: geral
title: Dev build + Metro: porta é 8082 (não 8081), build EAS development como marivscls5
tags: 
provenance: observado
evidence: apps/mobile/package.json (dev = expo start --port 8082); eas build 0c972b3b em expo.dev/accounts/marivscls5/projects/lucro-caseiro-dev; ipconfig Wi-Fi 192.168.1.10
decay: stable
created: 2026-06-26T12:41:07.397607100+00:00
updated: 2026-06-26T12:41:07.397607100+00:00
validated: 2026-06-26T12:41:07.397607100+00:00
links: 
---

Para testar no aparelho físico com dev client:

1. **Build**: de `apps/mobile`, `eas build --profile development --platform android --non-interactive --no-wait` (conta **marivscls5** / vasconcelosmariana05@gmail.com, dona; projeto EAS **lucro-caseiro-dev**; credenciais/keystore remotos OK). Perfil `development` = dev client + APK.
2. **Metro**: `cd apps/mobile && pnpm dev` → roda `expo start --port **8082**` (CORRIGE a memória [[physical-device-dev-build-testing]] que dizia 8081 — é **8082**). Explícito: `npx expo start --dev-client --lan --port 8082`.
3. **Conectar**: no dev client → "Enter URL manually" → `http://<IP_LAN_DO_PC>:8082`. IP atual do PC no Wi-Fi: **192.168.1.10** (muda ao reconectar; conferir com `ipconfig`). Celular tem que estar no mesmo Wi-Fi (192.168.1.x); liberar Node no Firewall do Windows p/ 8082.
   PEGADINHA: o pacote do projeto subiu 205 MB pro EAS por causa de `.codex-logs/metro-temp-lucro` (cache de Metro de outro agente) — candidato a `.easignore`/`.gitignore`.
