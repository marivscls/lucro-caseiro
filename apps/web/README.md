# Central de Marketing — Lucro Caseiro

PWA privada em Next.js, seguindo a arquitetura do Lunoa. Usa Supabase Auth, React Query e a API
Express do monorepo; nenhum segredo de IA fica no navegador.

## Desenvolvimento

1. Copie `.env.example` para `.env.local` e preencha as três variáveis públicas.
2. Na API, configure `MARKETING_USER_IDS` com o UUID da conta autorizada e, para IA,
   `GOOGLE_GENERATIVE_AI_API_KEY`.
3. Aplique `packages/database/src/migrations/036_marketing_pwa.sql` no Supabase.
4. Rode `pnpm --filter @lucro-caseiro/api dev` e `pnpm --filter @lucro-caseiro/web dev`.
5. Abra `http://localhost:3002`, entre e use “Importar estratégia completa” na página Hoje.

## Produção

- Build: `pnpm --filter @lucro-caseiro/web build`.
- Start: `pnpm --filter @lucro-caseiro/web start` (o Next usa `PORT` fornecida pelo host).
- Configure `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
  host do frontend.
- Na API, acrescente a origem do frontend a `CORS_ORIGIN`, mantenha `MARKETING_USER_IDS` preenchida e
  configure a chave Gemini.
- O manifest e o service worker tornam o app instalável; shell, leituras recentes e rascunhos de
  documentos continuam disponíveis offline e sincronizam na reconexão.
