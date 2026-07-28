---
id: b4494167-5f5b-4a10-90f0-1d83cea394aa
slug: scripts
type: scar
title: PWA local não está validado só porque a porta ou um perfil limpo renderiza
tags: pwa, preview, tela-branca, chrome, fontes, fallback, cache, validacao, recorrencia, porta, perfil-autenticado
provenance: observado
evidence: Capturas da usuária: C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\b199c5cf-87b4-405e-9051-c59e9898874d.png, C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\01239af7-332f-4212-8b73-4933991312a3.png e C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\39b0d549-c080-4beb-b669-a0c926896e0b.png; apps/mobile/src/app/_layout.tsx; apps/mobile/src/features/clients/api.ts; .aerofortress/tmp/live-chrome-8084.stdout.log; .aerofortress/tmp/chrome-live-final-normal-8084.png
decay: stable
created: 2026-07-24T23:25:28.312056700+00:00
updated: 2026-07-25T03:44:42.373810600+00:00
validated: 2026-07-25T03:44:42.373810600+00:00
links:
---

SINTOMA ORIGINAL (2026-07-24): o Lucro Caseiro foi informado como rodando em `http://localhost:8084`, mas a página ficou totalmente branca. O primeiro processo era `expo start --web --port 8084` e quebrava no runtime do Metro antes de montar `#root`; ele foi substituído pelo preview do PWA compilado.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-07-24): o preview compilado renderizou em um perfil headless limpo e a resposta declarou o problema resolvido, mas a usuária mostrou que a janela real do Chrome continuava totalmente branca. CAUSA CONFIRMADA: `RootLayout` ignorava o segundo retorno de `useFonts`; quando uma fonte falhava no cache/perfil persistido, `fontsLoaded` permanecia falso e `return null` mantinha o app vazio para sempre. CORREÇÃO: aceitar `fontError` como estado terminal e montar o app com a fonte de sistema.

NOVA RECORRÊNCIA (2026-07-25): depois de mover o preview, HTTP 200 e Playwright em perfil limpo renderizaram, mas a janela real continuou branca. A validação voltou a errar ao abrir outro navegador/perfil e depois atribuiu a falha à porta temporária `8087`. A usuária mostrou uma nova captura comprovando `localhost:8084` branco no Chrome real.

CAUSA FINAL DESTA RECORRÊNCIA: o perfil real estava autenticado e carregava clientes da API de produção antiga. A Home nova executava `.slice()` em `nextContactAt`, campo omitido pela API ainda sem a migration 043, e o React desmontava a árvore (`rootLength: 0`). Perfis limpos paravam no login e nunca percorriam esse código. A instrumentação na própria `8084` capturou a exceção; após normalizar o payload legado e rebuildar, o mesmo Chrome autenticado montou a Home (`rootLength: 64839`) sem erros. O servidor normal foi restaurado e uma captura final mostrou a Agenda com dados reais.

COMO EVITAR: validar no mesmo navegador, perfil, sessão e URL em que o defeito aparece. A prova de bootstrap deve incluir DOM montado e console sem exceções depois de carregar dados reais autenticados; login em perfil limpo, HTTP 200, screenshots simuladas e outra porta são apenas controles. Quando a UI anteceder API/migration, testar o payload legado real. Não encerrar previews temporários como se isso resolvesse uma exceção do produto; localizar a falha do perfil antes de afirmar a causa.
