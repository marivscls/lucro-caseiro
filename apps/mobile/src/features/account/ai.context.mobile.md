# ai.context.mobile.md — account

## Purpose

Permite que o usuário exclua definitivamente a própria conta a partir da tela de
Configurações. Atende exigência das lojas (Apple/Google) e da LGPD. A ação é
irreversível e apaga os dados do usuário no servidor.

## Non-goals

- Não tem tela própria: vive como uma ação na tela de Configurações.
- Não exporta dados antes de excluir, nem oferece período de carência/desfazer.
- Não cancela assinaturas na loja: o usuário deve cancelar pela App Store /
  Google Play / portal do provedor.

## Boundaries & Ownership

- Owner: feature `account` (mobile).
- Depende de: `shared/utils/api-client`, `shared/hooks/use-auth` (token +
  signOut) e React Query (limpar cache).
- Dependente: `app/settings.tsx` (botão "Excluir conta").
- Counterpart API: feature `account` (`DELETE /api/v1/account`).

## Code pointers

- `api.ts` — `deleteAccount(token)` chama `DELETE /api/v1/account`.
- `hooks.ts` — `useDeleteAccount()` (mutation): no sucesso faz `signOut()` e
  `queryClient.clear()`.
- UI + confirmação: `app/settings.tsx` (`handleDeleteAccount`, `runDeleteAccount`).

## Components

- Sem componentes próprios. A ação é um `Pressable` "Excluir conta" na zona de
  perigo de `settings.tsx`, com ícone de lixeira e estado de loading.

## Hooks

- `useDeleteAccount()` — React Query `useMutation`. `mutationFn` chama a API;
  `onSuccess` encerra a sessão (Supabase) e limpa o cache de queries.

## API Integration

- `DELETE /api/v1/account` com `Authorization: Bearer <token>`.
- Resposta esperada: `{ deleted: true }`. Sem corpo na requisição.

## Contracts

- Tipo local mínimo: `{ deleted: boolean }`. Sem schema em
  `@lucro-caseiro/contracts` (não há payload de entrada).

## Error Handling

- Confirmação em dois toques antes de chamar a API (aviso de ação definitiva).
- Em erro, exibe a mensagem real do backend via `ApiError`/`Error.message`
  (ex.: 503 "Não foi possível excluir a conta agora. Tente novamente mais
  tarde."). Em sucesso, redireciona para `/(auth)/login`.
- **401 (`ApiError.status === 401`, "Sessao invalida"):** o `authMiddleware`
  valida o token via `supabase.auth.getUser` a cada request; se o usuário já
  não existe no Auth (conta removida numa tentativa anterior) ou a sessão
  expirou, o request cai em 401. Nesse caso `runDeleteAccount` faz `signOut()`
  e vai pro login em vez de mostrar erro sem saída (o destino é o login nos dois
  casos).

## Performance

- Ação pontual e rara; sem listas/virtualização. `queryClient.clear()` evita
  reuso de cache de uma conta que não existe mais.

## Test matrix

- Manual: dois toques de confirmação; sucesso desloga e volta ao login; erro
  503 mostra mensagem clara e mantém o usuário logado.
- Hook: `onSuccess` chama signOut + clear (cobertura via integração).

## Examples

Fluxo no app: Configurações → "Excluir conta" → "Continuar" → "Excluir minha
conta" → conta apagada → tela de login.

## Change log / Decisions

- Confirmação em dois toques (decisão de UX) por ser ação destrutiva, em vez de
  digitar texto — público inclui usuários leigos/idosos.
- Exclusão é total e irreversível (espelha a decisão da API).
