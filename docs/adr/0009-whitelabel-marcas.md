# ADR-0009 — Arquitetura whitelabel: um código, N marcas

**Status:** aceito (2026-07-18)

## Contexto

O produto precisa atender marcas verticais, como Lucro na Papelaria e Lucro na
Manicure, sem forks do aplicativo nem manutenção duplicada.

## Decisão

1. `@lucro-caseiro/brands` mantém um `BrandConfig` framework-free por marca, com
   identidade de loja, overrides de tema, copy, flags e configuração AdMob opcional.
2. A marca é resolvida em build time, na ordem `BRAND` → `EXPO_PUBLIC_BRAND` →
   `NEXT_PUBLIC_BRAND` → `lucro-caseiro`. Não há troca de marca em runtime.
3. Features vivem no código principal e são ativadas por flags semânticas. Pontos de
   entrada usam `useFeature`; rotas diretas também são protegidas. A API repete a
   validação para operações exclusivas.
4. O tema mobile deriva light/dark com `buildThemes`. No web, uma escala 50–900 é
   gerada deterministicamente a partir de `brand.theme.primary`; cores semânticas
   continuam compartilhadas. Isso evita duplicar dez tokens em cada marca.
5. Assets mobile são resolvidos em `packages/brands/<id>/assets`, com fallback para
   `apps/mobile/assets` quando a marca ainda não possui um arquivo.
6. A API compartilhada identifica o cliente pelo header `x-brand`. O header controla
   apenas configuração/flags e observabilidade; identidade e autorização continuam
   vindo do token do usuário. Cada request gera log estruturado com marca, método,
   caminho e status.
7. O `easProjectId` também é isolado por marca no `BrandConfig`; ele não é segredo e
   pode ser sobrescrito por `EAS_PROJECT_ID` no ambiente.
8. AdMob pertence ao `BrandConfig`, mas IDs de marcas novas são fornecidos por envs do
   cofre EAS. IDs do Lucro Caseiro só podem servir como fallback em desenvolvimento.
9. Cada marca tem um app próprio nas lojas e um deploy web próprio. A escolha é domínio
   próprio por marca, com catálogo em `catalogo.<domínio-da-marca>`; os endereços reais
   são configurados por `NEXT_PUBLIC_SITE_URL` e `EXPO_PUBLIC_CATALOG_URL`, sem DNS
   codificado no código.

## Consequências

- Uma nova marca exige config, registry, assets, três profiles EAS e envs do deploy.
- `applicationId`, `bundleId`, scheme e assets nunca são compartilhados por acidente.
- Operações de variação enviam `x-brand` e são rejeitadas quando `catalogoCores` está
  desligado, mesmo que o front seja contornado.
- O submit às lojas permanece manual e depende de revisão humana do listing e das artes.

## O que não fazer

- Criar forks ou espalhar `if (brand === "...")` pelas telas.
- Confiar apenas no front para feature gating.
- Colocar IDs AdMob de novas marcas, credenciais ou segredos nos arquivos versionados.
