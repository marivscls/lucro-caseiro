# Triagem CodeQL — Lucro Caseiro — 2026-09-10

## Execução e cobertura

- CLI CodeQL 2.27.0; `codeql/javascript-queries@2.4.5` e `githubsecuritylab/codeql-javascript-queries@0.7.7`.
- 245 consultas verificadas pela skill: união explícita `security-and-quality` + `security-experimental` + consultas comunitárias `problem`/`path-problem`.
- Primeiro banco: snapshot de 09:36:20–09:36:53 BRT. Banco final posterior descrito ao final deste relatório.
- Qualidade do primeiro banco: 176.178 LOC baseline, 1.027 arquivos do projeto (1.137 incluindo externs), zero erros de extração, finalizado. O CLI reportou 976/990 arquivos JS/TS analisados; raízes intencionais: apps, packages, scripts, tools, supabase e arquivos-fonte da raiz; sem node_modules, builds, caches, docs e temporários.
- Conferência de fontes no primeiro snapshot: API 268 arquivos (teste retail.repo.pg.test.ts criado depois), web 66/66, mobile 487/487, packages 92/92. O SQL do Supabase não é analisado pelo extrator JS/TS.
- Diagnósticos de cobertura: 320 fontes remotas, 110 destinos (95 arquivos, 13 comandos, 2 SQL bruto). Modelo local validado para `drizzle-orm.sql.raw` e `postgres().unsafe`, nos pontos reais analytics.repo.pg.ts:230 e analytics/report.ts:16. As demais chamadas SQL do projeto usam parâmetros do ORM.
- Guard original de qualidade da skill tem uma incompatibilidade Windows: espera `C:` no ZIP, mas o CodeQL armazena `C_`. A cópia local `check_db_quality_windows.py` apenas normaliza esse prefixo; limiares originais preservados. Guard adaptado e verificação de suíte saíram com código 0.
- Execução local, sem upload de código. Extrações iniciais bloqueadas pelo sandbox/caminhada de caches foram corrigidas com execução autorizada e exclusões de travessia explícitas. Logs preservados.

## Problemas confirmados e correções

1. **ReDoS em mensagens de erro compartilhadas** (`packages/contracts/src/user-errors.ts`): regex não ancorada rodava antes do limite de tamanho. Repetições de `recurso ` levaram 15 ms/8 mil caracteres, 40 ms/16 mil e 181 ms/32 mil, demonstrando crescimento quadrático. Agora mensagens maiores que 600 caracteres retornam fallback antes de qualquer regex. Casos normais e limite anterior preservados. Após a correção, 800 mil caracteres retornaram em menos de 1 ms na medição local (não é benchmark universal).
2. **Worker asset-forge exposto sem autenticação** (`tools/asset-forge/worker.mjs`): `listen(PORT)` expunha todas as interfaces, aceitava qualquer POST e ignorava o bearer enviado pelo provider. Agora o padrão é loopback; interface remota sem API key impede startup; chave configurada exige bearer com comparação resistente a diferenças de tempo. Não houve chamada a provedor pago nos testes.
3. **Entrada/erros do worker**: slug arbitrário podia alterar o caminho do objeto de Storage; erros internos de upstream eram devolvidos ao cliente. Agora slug e prompt são validados, JSON/corpo têm limites, POST exige application/json (evita POST simples de páginas externas ao worker local), e falhas de geração retornam mensagem genérica. README atualizado; provider HTTP existente continua compatível.

## Testes das correções

- `apps/api/src/shared/user-errors.test.ts`: 3 testes; falha RED observada antes da correção; 3/3 após. `pnpm --filter @lucro-caseiro/contracts typecheck` passou.
- `tools/asset-forge/test/worker.test.mjs`: 4 testes novos de integração HTTP/processo (quatro falhas observadas antes do ajuste). Cobrem bearer ausente/incorreto/correto, provider HTTP + adapter stub real, recusa de host remoto sem chave, slugs maliciosos, prompt ausente/oversized, JSON inválido, Content-Type inadequado, corpo >1 MB e ausência de conteúdo upstream nas respostas.
- `node --test tools/asset-forge/test/*.test.mjs`: 17/17 passaram; sem provedores externos reais. Prettier dos cinco arquivos alterados passou.

## Triagem do primeiro SARIF

909 registros brutos, 19 regras (507 warning, 400 error, 2 note). Esses níveis incluem consultas de depuração/inventário e **não equivalem a 909 vulnerabilidades**.

- 464 registros de debugging (280 sources, 184 sinks): inventário de fluxos, sem alegação de exploração.
- 43 hotspots comunitários de audit (11 command, 3 reflected-XSS, 2 SQL, 27 code): os exemplos de produção usam execFile/argv sem shell, callbacks reais em setInterval, SQL bruto constante e estilos/JSON-LD de código/configuração confiável.
- 380 `untrusted-data-to-external-api-more-sources`: heurística ampla; inclui majoritariamente React Query (90 useQuery, 80 useMutation), React useMemo (62), mutateAsync (29), Vitest expect (24), useEffect (21). Chamada de biblioteca recebendo dados não é prova de injeção ou exfiltração. São pistas de revisão, não 380 falhas confirmadas.
- Outros 22 registros foram inspecionados. ReDoS e exposição de erros do worker foram confirmados/corrigidos. A revisão do worker revelou também falta de autenticação e de validação de slug.
- Falsos positivos: `ssrf-ipv6-transition-incomplete-guard` em CORS/safeExternalUrl (não fazem requisição de servidor); SSRF em Storage (host é configuração confiável, parâmetro remoto só compunha path); XSS em Link de calendário (caminho relativo + encodeURIComponent) e URLs de vídeo assinadas pelo Storage; property injection com UUIDs/enums e propriedades computadas em cópia de objeto; regex de tags dentro de um teste de segurança; substring de URL num filtro Playwright de fontes.
- Avisos de qualidade sem impacto de segurança confirmado: imports não usados, condicionais redundantes em UI, mock Vitest com hoisting e stat/read no preview de build local. A UI concorrente não foi alterada por esta revisão.

## Limites

A análise estática não demonstra ausência de vulnerabilidades. Consultas experimentais/comunitárias têm muitos hotspots; regras de autorização/isolamento de usuários e SQL/RLS exigem a revisão manual/integrada feita separadamente. Não houve pentest de produção. O worker remoto deve ficar atrás de HTTPS e usar uma chave forte; o modo offline de loopback permanece sem chave por padrão. Os resultados são snapshots e não incluem edições posteriores à extração indicada.

## Verificação final após as correções

- Nova extração iniciada em **09:53:57 BRT**, concluída antes da análise final que terminou em **10:04 BRT**. `final-analysis.log` registra exit 0 e as 245 consultas; sem notificações de erro de execução no SARIF.
- Guard de qualidade final aprovado: **177.606 LOC baseline, 1.028 arquivos do projeto, 1.138 no arquivo de fontes incluindo externs, zero erros, finalizado**. CLI: **981/992 arquivos JS/TS**; os 11 ausentes foram conferidos: 4 scripts de skills em `.github/skills`, 6 exportadores de arte em `imagens` e 1 arquivo gerado `apps/mobile/dist-home-review/push-worker.js`.
- Conferência das fontes: API **270/270**, web **66/66**, mobile **487/487**, packages **92/92**, asset-forge **15/15**, sem fonte esperada ausente nesses escopos.
- O SARIF final **não contém mais** `js/polynomial-redos`, `js/stack-trace-exposure` nem `javascript/ssrf` (esta última apontava o path do worker). Isso confirma que os fluxos anteriores deixaram de ser sinalizados depois das mudanças.
- **957 registros brutos / 16 regras**: 489 debugging (282 sources + 207 sinks), 46 audit hotspots, 403 heurística broad external-API, 19 outros. Níveis brutos: 530 warning, 425 error, 2 note. O aumento de inventários decorre do snapshot ampliado e dos novos testes; não é aumento de vulnerabilidades confirmadas. Nenhuma nova exploração confirmada apareceu no rescan.
- Dos 19 restantes, os 2 imports não utilizados foram removidos **após** essa extração; `contracts typecheck` e os 3 testes de mensagens passaram novamente. Os demais repetem os falsos positivos/avisos de qualidade discutidos acima.
- Delta após extração final: `apps/mobile/src/shared/utils/upload-image.test.ts` (trabalho concorrente), `packages/contracts/src/schemas/goal.ts` e `recipe.ts` (remoção dos imports). Nenhuma outra fonte JS/TS arquivada diferia no momento da conferência.

Artefatos finais: `raw/final-results.sarif` (original), `results/final-results.sarif` (cópia final), `results/final-summary.json`, `final-quality.json`, `final-coverage.json`, `final-changed-since-extraction.json`. A rodada inicial permanece preservada em `raw/results.sarif` e `results/summary.json`.
