---
id: 606051ff-9e32-489a-baef-0f684256f9c7
slug: ui
type: scar
title: Personalização nova não salva enquanto a PWA local usa uma API de produção antiga
tags: catalogo, personalizador, persistencia, api-producao, railway, deploy, correcao
provenance: dito
evidence: apps/mobile/.env usa https://lucro-caseiroapi-production.up.railway.app; nenhum processo local da API em 2026-08-18; relato da usuária após testar o bundle PWA novo
decay: stable
created: 2026-08-18T20:46:12.362655500+00:00
updated: 2026-08-18T20:46:12.362655500+00:00
validated: 2026-08-18T20:46:12.362655500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-18): os seletores de cor do título e da descrição alteravam a prévia, mas após salvar os valores voltavam ao padrão. CAUSA OBSERVADA: apps/mobile/.env aponta EXPO_PUBLIC_API_URL para a API de produção da Railway, não existe API local rodando, e o backend com os novos campos/migração ainda não foi publicado; o UpdateCatalogSettingsDto antigo remove campos desconhecidos, então a resposta salva não contém as cores. COMO EVITAR: uma mudança de personalização persistente só está concluída quando contratos, migração, API e front estão publicados em conjunto; testar o retorno efetivo do PATCH, não apenas a prévia e testes locais. Se o front puder chegar antes, detectar campos ausentes na resposta e não mostrar sucesso falso.
