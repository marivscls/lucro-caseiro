---
id: 91462085-6e0d-4a9a-82be-438f1f85c3fe
slug: build
type: antibody
title: Context lint rejeita TODO e PLACEHOLDER mesmo em texto explicativo
tags:
provenance: observado
evidence: apps/mobile/src/features/pricing/ai.context.mobile.md; apps/api/src/features/catalog/ai.context.api.md; falhas de pnpm context:lint em 2026-07-22 e 2026-07-29
decay: stable
created: 2026-07-22T23:25:10.838490600+00:00
updated: 2026-07-29T12:47:56.748974+00:00
validated: 2026-07-29T12:47:56.748974+00:00
links:
---

SINTOMAS: `pnpm context:lint` rejeita qualquer ocorrência das sequências `TODO` ou `PLACEHOLDER` em arquivos `ai.context.*.md`, mesmo quando aparecem dentro de texto legítimo. Em 2026-07-22, “Todos os campos” acionou `TODO`; em 2026-07-29, a descrição “placeholder com inicial” do Catálogo acionou `PLACEHOLDER`.

CORREÇÃO: reescrever a frase sem essas sequências. Usar “cada/os campos” no lugar de “todo/todos” e “bloco visual” ou “imagem padrão” no lugar do termo técnico proibido.

COMO EVITAR: antes de validar contextos em português, não usar palavras ou termos que contenham `todo` ou `placeholder`. O gate `pnpm context:lint` aplica essa regra mecanicamente.

**Graduated → enforced by sensor:** cmd: pnpm context:lint
