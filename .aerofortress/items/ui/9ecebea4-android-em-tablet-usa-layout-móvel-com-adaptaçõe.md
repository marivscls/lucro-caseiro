---
id: 9ecebea4-6084-4716-964a-149a9f34b613
slug: ui
type: fact
title: Android em tablet usa layout móvel com adaptações pontuais por largura
tags: tablet, android, responsividade, play-store
provenance: observado
evidence: Teste Maestro de 2026-07-23; imagens/play-store-tablets-2026-07-23/; apps/mobile/src/shared/layout/use-desktop-layout.ts:8; apps/mobile/src/app/tabs/more.tsx:143; apps/mobile/android/app/src/main/AndroidManifest.xml:28
decay: seasonal
created: 2026-07-23T12:24:22.165691500+00:00
updated: 2026-07-23T12:51:48.021999200+00:00
validated: 2026-07-23T12:51:48.021999200+00:00
links:
---

No app nativo Android, o hook canônico `useDesktopLayout` continua restrito à web, então tablets não recebem a shell desktop. Ainda assim, um teste real em emulador Android com o bundle atual confirmou comportamento funcional e utilizável em 1080×1920 (perfil de 7″) e 1440×2560 (perfil de 10″): navegação, rolagem, central de recursos e precificação abriram sem cortes impeditivos; a tela Mais passa de lista em 7″ para grade em duas colunas em 10″. O app permanece bloqueado em retrato. Tratar o suporte atual como compatibilidade funcional com responsividade pontual, não como uma arquitetura nativa de tablet completa.
