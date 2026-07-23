---
id: 76ff7974-e861-4511-87ee-edc51e485d25
slug: build
type: fact
title: Último build Android de produção é versionCode 20 no commit caf962c
tags: android, eas, production, versionCode, build, google-play
provenance: observado
evidence: `npx -y eas-cli build:list --platform android --limit 6 --json --non-interactive` em 2026-07-19; eas.json; apps/mobile/app.json
decay: volatile
created: 2026-07-20T02:35:18.565293500+00:00
updated: 2026-07-20T02:35:18.565293500+00:00
validated: 2026-07-20T02:35:18.565293500+00:00
links: 
---

Consulta ao EAS em 2026-07-19 confirmou que o build Android de produção mais recente concluído é o AAB `94dd6dce-8bed-460f-8c5b-5f01e28a04d3`, versão 1.2.0, versionCode 20, gerado do commit `caf962c` em 2026-07-14. O `appVersionSource` é remoto e o perfil production usa `autoIncrement`, portanto o próximo build de produção deve receber versionCode 21; o `versionCode: 19` em app.json não é a fonte autoritativa. O main atual avançou substancialmente desde esse commit, então a próxima rodada deve começar com build development e teste em aparelho antes do AAB de produção.
