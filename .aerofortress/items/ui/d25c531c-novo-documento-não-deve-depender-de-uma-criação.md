---
id: d25c531c-15f6-49cb-8870-87f636ffc6df
slug: ui
type: scar
title: Novo documento não deve depender de uma criação silenciosa na API
tags: web, central-de-marketing, documentos, formulario, erro, feedback
provenance: observado
evidence: apps/web/src/app/(dashboard)/documents/page.tsx; lint, typecheck e testes web aprovados; bundle dev recompilado contém o novo diálogo
decay: stable
created: 2026-07-17T00:30:12.148227800+00:00
updated: 2026-07-17T00:30:12.148227800+00:00
validated: 2026-07-17T00:30:12.148227800+00:00
links:
---

SINTOMA (2026-07-16): ao clicar em “Novo documento”, nada visível acontecia. CAUSA: DocumentsPage disparava imediatamente um POST com conteúdo padrão, sem abrir formulário; enquanto a requisição estava em andamento ou falhava, a ação não oferecia um fluxo de criação claro e o erro podia parecer ausência de clique. CORREÇÃO: o botão abre um diálogo acessível com título e conteúdo inicial; o envio valida o título, mostra “Criando…”, impede duplicidade, exibe o erro dentro do diálogo e, ao concluir, seleciona o documento criado e hidrata seu editor. COMO EVITAR: ações primárias de criação devem produzir feedback visual imediato e manter erros no contexto da ação, não depender de uma mutação silenciosa para a interface mudar.
