---
id: d7318d0d-5c03-4d0c-bd7a-da38ac188212
slug: release
type: scar
title: EAS auto-submit não funciona sem chave de conta de serviço do Google Play
tags: android, eas, google-play, auto-submit, credentials, release
provenance: observado
evidence: EAS build 1c67361b-db37-42fc-9007-81ff54caa857; saída do comando em 2026-08-05
decay: stable
created: 2026-08-05T15:40:15.522795300+00:00
updated: 2026-08-05T15:40:15.522795300+00:00
validated: 2026-08-05T15:40:15.522795300+00:00
links:
---

SINTOMA (2026-08-05): `eas build --profile production --platform android --auto-submit --non-interactive --no-wait` aceitou e iniciou o build Android 24, mas encerrou o comando com erro ao preparar a submissão: `Google Service Account Keys cannot be set up in --non-interactive mode.` O build continuou no EAS; somente o auto-submit não foi criado. COMO EVITAR: antes de prometer submissão automática à Play, confirmar que o projeto EAS possui uma Google Service Account Key configurada. Sem ela, gerar o AAB e enviar manualmente pelo Play Console ou executar a configuração interativa com a proprietária; nunca tratar o exit code do auto-submit como cancelamento do build.
