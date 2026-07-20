---
id: 9a48317e-5744-46bb-bf8b-d459d2c5c4e6
slug: ui
type: scar
title: Modal de Etiquetas precisa de composição móvel completa, não só conteúdo rolável
tags: mobile, pwa, modal, etiquetas, carrossel, preview, inputs, buttons, responsividade, service-worker, cache
provenance: dito
evidence: Mensagens e capturas da usuária em 2026-07-20; apps/mobile/src/app/labels.tsx; apps/mobile/src/features/labels/components/create-label-form.tsx; apps/mobile/src/features/labels/components/template-picker.tsx; apps/mobile/src/features/labels/components/label-preview.tsx; packages/ui/src/components/button.tsx; apps/mobile/public/index.html
decay: stable
created: 2026-07-20T20:30:39.984931300+00:00
updated: 2026-07-20T22:11:50.437081400+00:00
validated: 2026-07-20T22:11:50.437081400+00:00
links:
---

SINTOMA ORIGINAL (2026-07-20, Android): “Nova etiqueta” escondia campos e truncava ações longas; a primeira correção removeu `flex: 1` da coluna móvel e flexibilizou o Button. RECORRÊNCIA/CORREÇÃO DA USUÁRIA NO MESMO DIA, na versão celular do PWA: o modal ainda não seguia o padrão móvel dos demais; os modelos não podiam ser passados lateralmente, “Baixar / Compartilhar” perdia a palavra Compartilhar, a pré-visualização ficava cortada e os inputs deslocados. A composição foi corrigida com carrossel horizontal, preview pela largura disponível, formulário com inset simétrico, rodapé empilhado no mobile e rótulo de botão em até duas linhas. SEGUNDA RECORRÊNCIA: após a publicação, a captura ainda mostrou exatamente o rodapé da versão anterior (duas colunas e texto em uma linha), embora o bundle novo em produção já contivesse o rótulo completo e o layout responsivo. A causa foi o ciclo de atualização do PWA: `skipWaiting()`/`clients.claim()` atualizavam o service worker, mas a página já aberta continuava executando o JavaScript antigo até outra recarga. CORREÇÃO: registrar `/sw.js` com `updateViaCache: "none"` e, quando já existe um controlador, recarregar uma única vez em `controllerchange`. COMO EVITAR: validar o modal inteiro em viewport de celular e validar também a troca de versão sobre uma instalação PWA já controlada; um build/deploy novo não prova que a página aberta abandonou o bundle anterior.
