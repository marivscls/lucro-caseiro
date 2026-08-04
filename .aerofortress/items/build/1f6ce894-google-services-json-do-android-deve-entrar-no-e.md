---
id: 1f6ce894-a556-49e3-9ed2-76c134e74743
slug: build
type: scar
title: google-services.json do Android deve entrar no EAS, não no Git
tags: fcm, eas, android, secrets
provenance: observado
evidence: commit 1d49628; .gitignore; apps/mobile/app.config.ts; saída de node scripts/security-scan-secrets.mjs em 2026-08-04
decay: stable
created: 2026-08-04T20:46:02.580032200+00:00
updated: 2026-08-04T20:46:02.580032200+00:00
validated: 2026-08-04T20:46:02.580032200+00:00
links:
---

SINTOMA (2026-08-04): ao preparar o FCM V1, `apps/mobile/google-services.json` foi staged e `node scripts/security-scan-secrets.mjs` bloqueou o commit como possível chave Google. CORREÇÃO: ignorar o arquivo no Git, configurar `android.googleServicesFile` para usar `process.env.GOOGLE_SERVICES_JSON` com fallback local e criar `GOOGLE_SERVICES_JSON` como variável EAS secreta do tipo file nos ambientes development, preview e production. PREVENÇÃO: nunca versionar esse arquivo neste repositório; validar o scanner antes do commit e conferir a variável no EAS antes do build.
