---
id: 3e85a55d-d773-473c-8b42-7ca8d81a8336
slug: build
type: scar
title: "Novo build" durante testes = development build primeiro, produção só depois de testar
tags: android, build, development, preview, teste-local, eas
provenance: dito
evidence: Correções da usuária em 2026-07-11 e 2026-08-15; em 2026-08-15 o build EAS preview 38a410b8-4d07-4ae5-83ac-6017bfe30b8b foi cancelado após a correção
decay: stable
created: 2026-07-11T14:00:28.950209600+00:00
updated: 2026-08-15T23:39:42.223258100+00:00
validated: 2026-08-15T23:39:42.223258100+00:00
links:
---

SINTOMA (2026-07-11): após adicionar módulo nativo (expo-store-review), a usuária pediu "dispara um novo build" e eu disparei o build de PRODUÇÃO (.aab). Ela corrigiu: nesta fase ela precisa TESTAR antes no aparelho — o build certo era o DEVELOPMENT (dev client APK, perfil `development`, que conecta no Metro).

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-15): ao tentar disponibilizar um mock de onboarding no Android, foi iniciado um build EAS `preview` antes de validar localmente as telas no runtime mobile. A usuária corrigiu explicitamente: primeiro adicionar e testar as telas localmente; só depois enviar um build. O build remoto em andamento foi cancelado.

COMO EVITAR: enquanto o app estiver em fase de testes internos, implementar no fonte compartilhado e validar primeiro no runtime Android local já acessível (aparelho/emulador + development build/Metro). Só iniciar EAS após a usuária confirmar o teste local. "Novo build" sem qualificador = development build (perfil `development`, APK, distribution internal); produção/.aab apenas quando ela disser explicitamente que é para a loja ou que os testes passaram. Fluxo canônico: código → teste Android local → confirmação da usuária → development/preview APK se necessário → produção → Play Console.
