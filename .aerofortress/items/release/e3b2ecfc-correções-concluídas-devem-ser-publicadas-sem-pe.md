---
id: e3b2ecfc-c063-48e7-ac15-1c7d0a4af2ea
slug: release
type: scar
title: Correções concluídas devem ser publicadas sem pedir confirmação
tags: deploy, publicacao, preferencia, workflow, railway, main
provenance: dito
evidence: Mensagem da usuária em 2026-07-20: “simm, sempre publique sem perguntar”
decay: stable
created: 2026-07-20T23:26:08.480061200+00:00
updated: 2026-07-20T23:26:08.480061200+00:00
validated: 2026-07-20T23:26:08.480061200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-20): após sucessivas correções no app, o agente ainda encerrava perguntando “Posso publicar?”. A preferência permanente deste projeto é publicar automaticamente toda correção concluída e validada, sem pedir confirmação adicional. COMO EVITAR: quando a solicitação autoriza uma mudança no Lucro Caseiro, implementar, validar, criar commit isolado, enviar para `main`, acompanhar o Railway e confirmar o bundle em produção no mesmo fluxo; só interromper se surgir um risco destrutivo, bloqueio real ou expansão de escopo.
