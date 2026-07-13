---
id: a65beb85-1c85-423f-bc57-1c233b165ec7
slug: ui
type: scar
title: App crashava ao abrir em conta FREE em produção: BannerAd do AdMob renderizado antes do initialize()
tags: admob, crash, free, producao, ads, banner
provenance: dito
evidence: Confirmado pela usuária 2026-07-07 ("simm, admob sim"). Arquivos: apps/mobile/src/shared/ads-init.ts; apps/mobile/src/shared/components/ad-banner.native.tsx; apps/mobile/src/shared/hooks/use-show-ads.ts. Commit relacionado: 834093a fix(ads): skip banner rendering in dev builds to avoid native crash
decay: stable
created: 2026-07-07T12:53:22.086768900+00:00
updated: 2026-07-07T12:53:22.086768900+00:00
validated: 2026-07-07T12:53:22.086768900+00:00
links: 
---

SINTOMA: em build de PRODUÇÃO, abrir o app numa conta gratuita crashava e fechava logo em seguida. Contas premium não sofriam. CAUSA: anúncios só aparecem pra free (`useShowAds` = `!isProfilePremiumActive`), então só a conta free montava o `<BannerAd>` do `react-native-google-mobile-ads`. Renderizar o BannerAd (ou criar Interstitial) ANTES do `MobileAds().initialize()` resolver crasha NATIVAMENTE em produção. Em dev os ads nem renderizam, então o crash só aparecia no app publicado — daí só pegar em produção.

CORREÇÃO (no main, à prova de falha em várias camadas):

- `ensureAdsInitialized()` (apps/mobile/src/shared/ads-init.ts): inicializa o SDK UMA vez, memoizado; qualquer erro → resolve `false` (nunca derruba o app).
- `AdBanner` (ad-banner.native.tsx): só renderiza o banner DEPOIS de `ensureAdsInitialized()` resolver `true` (gate `adsReady`); `require` do módulo em try/catch (`admobLoadFailed`); em `__DEV__` retorna null.
- `useShowAds`: retorna `false` enquanto o profile não carregou (não assume free sem perfil).

COMO EVITAR REPETIR: nunca montar BannerAd/Interstitial do AdMob sem antes esperar o initialize() resolver; todo uso de ad tem que falhar em silêncio (null) em vez de derrubar; e lembrar que bug só-em-conta-free-em-produção quase sempre é o caminho de anúncios (só free monta ad + ads não rodam em dev). Ver [[freemium-limits-decision]].
