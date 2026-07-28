---
id: 5c7f5041-a4a0-47da-9491-ab2b43765a0e
slug: ui
type: scar
title: Trocar PNG de estado vazio exige remover seletores condicionais concorrentes
tags: insumos, empty-state, imagem, personalizacao, react-native
provenance: dito
evidence: Correção da usuária e captura de 2026-07-25; apps/mobile/src/app/materials.tsx; apps/mobile/src/assets/materials-empty.png
decay: stable
created: 2026-07-25T17:46:22.809256+00:00
updated: 2026-07-25T17:46:22.809256+00:00
validated: 2026-07-25T17:46:22.809256+00:00
links:
---

SINTOMA: após substituir `materials-empty.png` pela imagem escolhida pela usuária, a tela de Insumos continuou exibindo a calculadora antiga. CAUSA: o componente usava `materialsEmpty` apenas para o perfil `food` e desviava os demais perfis para `pricingEmpty`. CORREÇÃO CANÔNICA: a tela estrutural de Insumos deve usar sempre o asset canônico `materials-empty.png`; personalização por perfil não pode substituir silenciosamente a ilustração escolhida para a tela. COMO EVITAR: ao trocar um asset, verificar todas as condições no ponto de renderização, não apenas a referência/importação do arquivo.
