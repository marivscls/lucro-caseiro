---
id: 6648f2ec-2378-4a85-b8c9-eebcfcc50df3
slug: ui
type: scar
title: Novo atendimento de Serviços não pode abrir com linguagem de encomenda
tags: mobile, servicos, atendimento, agenda, order-form, ux, fluxo, android, maestro
provenance: dito
evidence: apps/mobile/src/app/services.tsx; apps/mobile/src/features/orders/components/order-form.tsx; captura da usuária em 2026-08-04; AVD lucro_e2e em 2026-08-04; lint, typecheck e 420 testes mobile aprovados
decay: stable
created: 2026-08-04T11:09:11.870081200+00:00
updated: 2026-08-04T11:20:59.749621800+00:00
validated: 2026-08-04T11:20:59.749621800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-04): o botão `Novo atendimento` no painel de um serviço abria o `OrderForm` padrão com título `Adicionar encomenda`, imagem de encomenda, opção `Sem serviço`, cadastro rápido e personalização. CAUSA: o fluxo reutilizava corretamente o mesmo modelo de Agenda/encomendas, mas não informava ao componente o contexto de atendimento. CORREÇÃO CANÔNICA: `OrderForm` aceita `mode="appointment"`; nesse modo usa título/CTA de atendimento, mantém o serviço de origem obrigatório, exige horário e local, e remove campos exclusivos de encomenda. O registro continua compatível com Agenda, Financeiro e ciclo de conclusão. VALIDAÇÃO NO ANDROID (AVD lucro_e2e, Pixel 1080×2400): modal abriu como `Novo atendimento`, serviço `Teste de serviço 2` pré-selecionado, rodapé `Salvar atendimento` fixo sem cobrir campos, rolagem alcançou Observações, horário aceitou `14:30` com foco e o texto de detalhes do local foi encurtado após a primeira captura revelar truncamento. COMO EVITAR: compartilhamento de modelo de dados não autoriza compartilhar linguagem e campos irrelevantes da interface; todo acionador contextual deve selecionar explicitamente a variante de UX correta.
