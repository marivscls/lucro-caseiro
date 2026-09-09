# Lote 5 — correções UX

## Estado encontrado

- “Editar cliente” estava condicionado à existência de telefone.
- A Agenda recriava `showTip=true` a cada montagem; `_OrderDetail` não era utilizado.
- Menus de ordenação e ações de fornecedores usavam `showAlert`, sem lista de opções como Clientes. O host de alertas já era customizado na base; não eram mais `Alert.alert` diretos.
- O card de fornecedor ainda aplicava sombra.
- “Agora não” já era texto tocável. A orientação ainda tinha segundo botão grande e a dispensa desmontava o card imediatamente.

## Implementado

- Editar cliente funciona sem telefone; WhatsApp continua condicionado ao contato.
- Dica da Agenda persistida por conta/aparelho no adaptador AsyncStorage (`agenda-tip:v1:<userId>`). Sem flash durante leitura; outra conta mantém sua própria preferência.
- Removido `_OrderDetail`, seu import `Card` e comentários de lint que só existiam pela duplicação.
- Fornecedores usam `SupplierOptionsModal` sobre `StandardModal`, com opções de 52 dp, seleção acessível na ordenação e fechamento antes da ação. Os fluxos existentes de exclusão/arquivo continuam nos callbacks da rota.
- Card de fornecedor usa borda sem sombra.
- Orientação entra/sai em fade de 180 ms; dispensa conclui após a animação. Preferência de movimento reduzido torna a dispensa imediata. Um CTA grande; secundário, dispensa e suporte em texto tocável de 48 dp.

## Arquivos modificados a partir da base recebida

Copiar somente os arquivos abaixo para integrar. Outras alterações que aparecem no `git status` já pertenciam à base recebida. Não copiar `tsbuildinfo`.

1. `apps/mobile/src/app/tabs/agenda.tsx`
2. `apps/mobile/src/features/clients/components/client-detail.tsx`
3. `apps/mobile/src/features/clients/components/client-detail.test.ts` (novo)
4. `apps/mobile/src/features/clients/ai.context.mobile.md`
5. `apps/mobile/src/features/orders/use-agenda-tip.ts` (novo)
6. `apps/mobile/src/features/orders/use-agenda-tip.test.ts` (novo)
7. `apps/mobile/src/features/orders/ai.context.mobile.md`
8. `apps/mobile/src/features/suppliers/components/supplier-list.tsx`
9. `apps/mobile/src/features/suppliers/components/supplier-card.tsx`
10. `apps/mobile/src/features/suppliers/components/supplier-options-modal.tsx` (novo)
11. `apps/mobile/src/features/suppliers/components/supplier-menus.test.ts` (novo)
12. `apps/mobile/src/features/suppliers/ai.context.mobile.md`
13. `apps/mobile/src/shared/guidance/screen-guidance.tsx`
14. `apps/mobile/src/shared/guidance/screen-guidance.test.ts` (novo)
15. `docs/orientacao-contextual-primeiro-valor.md`

## Verificação

- TDD observado: editar sem telefone falhou pela ausência da ação; hook da dica com comportamento original em memória falhou no retorno e no flash; menus falharam pela ausência de diálogos; guidance falhou pela remoção imediata e pelo segundo CTA grande. Todos passaram após as correções.
- 45 testes passaram em 10 arquivos: cliente, dica/agrupamento de Agenda, fornecedores e guidance.
- Após ajuste final do teste de timers, os 3 testes de `screen-guidance.test.ts` passaram novamente.
- `tsc --noEmit` do mobile: exit 0.
- ESLint dos 11 arquivos TS/TSX tocados: exit 0, sem avisos.
- Prettier dos 15 arquivos: todos válidos.
- `git diff --check`: exit 0 (somente avisos de conversão LF/CRLF do Git).
- `context-lint-mobile.mjs`: válido; aviso preexistente de `verticals/` sem contexto.
- Vitest precisou de execução escalada porque esbuild não podia ler ancestrais no sandbox; execução local autorizada pelo revisor automático. Não há dependência nova nem acesso a produção.
- Ainda cabe à integração fazer a inspeção visual/navegação do app consolidado. Não foram realizados testes físicos Android/iOS neste lote.

Sem commits, PR ou alterações na árvore principal.
