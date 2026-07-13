---
id: 3e85a55d-d773-473c-8b42-7ca8d81a8336
slug: build
type: scar
title: "Novo build" durante testes = development build primeiro, produção só depois de testar
tags: eas, dev-build, fluxo
provenance: dito
evidence: apps/mobile/eas.json (perfis development/production)
decay: seasonal
created: 2026-07-11T14:00:28.950209600+00:00
updated: 2026-07-11T14:00:28.950209600+00:00
validated: 2026-07-11T14:00:28.950209600+00:00
links: 
---

SINTOMA (2026-07-11): após adicionar módulo nativo (expo-store-review), a usuária pediu "dispara um novo build" e eu disparei o build de PRODUÇÃO (.aab). Ela corrigiu: nesta fase ela precisa TESTAR antes no aparelho — o build certo era o DEVELOPMENT (dev client APK, perfil `development`, que conecta no Metro).

COMO EVITAR: enquanto o app estiver em fase de testes internos, "novo build" sem qualificador = development build (perfil `development`, APK, distribution internal). Build de produção/.aab só quando ela disser explicitamente que é pra loja ou que os testes passaram. O fluxo dela: dev build no aparelho físico + Metro (porta fixa 8083) → testa → só então produção → Play Console.
