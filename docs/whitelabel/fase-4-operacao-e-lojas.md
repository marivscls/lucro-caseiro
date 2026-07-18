# Fase 4 — Operacao multi-marca: builds, AdMob e lojas

> STATUS: IMPLEMENTADA EM 2026-07-18. Publicacao depende de IDs AdMob, artes e
> revisao humana; `eas submit` continua deliberadamente manual.
> Regras globais: ver README.md desta pasta.

## Objetivo

Deixar a operacao de N marcas redonda: builds reproduziveis, monetizacao
separada por app e publicacao nas lojas.

## Tarefa 1 — AdMob por marca

- Criar unidades AdMob proprias para cada marca nova (conta/console fora do
  escopo de codigo — registrar os IDs no cofre de segredos do time).
- Mover os IDs de AdMob do `app.config.ts` estatico para a BrandConfig
  (campos opcionais `admob: { androidAppId, iosAppId, bannerUnitIdAndroid, interstitialUnitIdAndroid }`),
  com fallback para os IDs do Lucro Caseiro apenas em desenvolvimento.
- Nunca commitar IDs novos em texto claro se o repo adotar secrets — seguir o
  padrao ja usado para Supabase (`.env.example` documenta, valor real fora do git).

## Tarefa 2 — Scripts de build por marca

- Adicionar scripts no `apps/mobile/package.json`:
  `build:papelaria`, `build:papelaria:preview` etc., encapsulando
  `eas build --profile papelaria-production`.
- Criar profile EAS equivalente para cada marca nova (manicure etc.) seguindo o
  padrao `papelaria-*` ja existente.
- Documentar em `docs/whitelabel/como-gerar-build.md`: tabela marca -> profile ->
  comando -> artefato.

## Tarefa 3 — Web: deploy por marca

- Definir um deploy por marca (Railway/Vercel) diferenciado apenas por env
  (`BRAND` / `NEXT_PUBLIC_BRAND`). Documentar as envs de cada marca em
  `.env.example` (sem valores sensiveis).
- Dominio por marca: registrar decisao no ADR-0009 (subdominio vs dominio
  proprio) e refletir em `EXPO_PUBLIC_CATALOG_URL` e equivalents do web.

## Tarefa 4 — Publicacao nas lojas

- Google Play: um app por marca (applicationId proprio ja vem da BrandConfig).
  Preparar listing base (titulo, descricao curta, screenshots) por marca em
  `apps/mobile/store-listings/<marca>/` como markdown, para revisao humana
  antes do upload. Screenshots reais ficam fora do escopo de codigo.
- iOS: mesmo criterio (bundleId proprio). Submit via `eas submit` somente
  apos aprovacao humana — NAO automatizar submit nesta fase.
- `eas.json`: bloco `submit` por marca se aplicavel.

## Tarefa 5 — API multi-marca (fechamento)

- Se a Fase 3 escolheu coluna `brand` no tenant: garantir que analytics e
  relatorios (`analytics:report`) separam por marca.
- Se escolheu header `x-brand`: adicionar logging/metrica por marca.
- Atualizar ADR-0009 com a decisao final e consequencias.

## Validacao obrigatoria

```bash
pnpm typecheck && pnpm test && pnpm build
```

- `eas build --profile <marca>-production` gera artefato para cada marca
  (rodar ao menos papelaria; manicure pode ficar para o momento da arte final).
- Checklist de loja completo para papelaria (listings revisados por humano).
- Nenhum segredo novo commitado.

## Formato do reporte final

1. Onde os IDs AdMob vivem agora e como adicionar de uma marca nova
2. Tabela marca -> profile -> comando de build
3. Envs por ambiente/marca documentadas
4. Status dos listings de loja
5. Decisao final de separacao por marca na API
6. Pendencias conscientes para fases futuras
