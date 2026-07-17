---
id: 28c6b1de-5ae5-47d6-a09d-c6723a46e5df
slug: ui
type: scar
title: Next dev pode atualizar JSX sem atualizar globals.css e misturar layouts incompatíveis
tags: web, dashboard, next, turbopack, hmr, css, regressao
provenance: observado
evidence: Captura da usuária em 2026-07-16; apps/web/src/app/(dashboard)/page.tsx; apps/web/src/app/globals.css; CSS servido em localhost:3002 antes/depois do reinício; screenshots Chromium 1440/1000/700
decay: stable
created: 2026-07-17T00:10:19.472694+00:00
updated: 2026-07-17T00:15:39.915878200+00:00
validated: 2026-07-17T00:15:39.915878200+00:00
links:
---

SINTOMA (2026-07-16): após transformar a Home em duas pilhas independentes, a captura da usuária mostrou todos os painéis comprimidos em colunas estreitíssimas no lado esquerdo, com texto quebrando palavra por palavra e grande área vazia à direita. CAUSA CONFIRMADA: o navegador recebeu o JSX novo (`dashboard-main`/`dashboard-rail`), mas o servidor Next/Turbopack continuou servindo o CSS anterior de `.today-grid` com 12 colunas; cada nova pilha ocupou 1/12 da largura. `globals.css` no disco já estava correto, porém o chunk servido estava stale. CORREÇÃO: renomear a classe para `.dashboard-layout`, declarar `width:100%` nos contêineres/filhos, simplificar o breakpoint sem `display:contents` e reiniciar o servidor Next. VALIDAÇÃO: CSS servido passou a conter `.dashboard-layout` e não `.today-grid`; screenshots headless em 1440, 1000 e 700 px confirmaram duas colunas no desktop e largura total nos breakpoints menores. COMO EVITAR: após mudança coordenada de markup + CSS em Next dev, conferir o CSS HTTP efetivamente servido; se HTML atualizou e aparência é incompatível com a fonte, suspeitar de HMR/Turbopack stale e reiniciar antes de alterar o layout novamente.
