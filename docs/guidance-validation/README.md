# Evidências locais — orientação e primeiro uso

Repositório: Lucro Caseiro. Data: 07/09/2026. Dados de teste identificados; nenhum acesso ou escrita em produção.

## Verificações

- Suíte completa: 642 testes mobile, 780 de API e 34 web aprovados (1.456 testes).
- Typecheck e lint do monorepositório aprovados; o lint da API mantém 37 avisos existentes.
- Builds locais de API, web e PWA aprovados com configuração de teste.
- `pnpm context:lint` aprovado, com avisos anteriores de contexto ausente em `verticals`.
- `pnpm sherif` aprovado. `pnpm security:secrets` não encontrou segredos conhecidos nos arquivos rastreados.
- `pnpm knip:full`: não aprovado. Relata 375 arquivos, incluindo artefatos e scripts anteriores em diretórios de imagens/cache, além de dependências/exports/tipos sem uso. O script desta entrega está declarado como entrypoint. Não foram removidos arquivos do usuário para limpar o check.
- `pnpm security:audit`: não aprovado; 18 vulnerabilidades em dependências (14 altas e 4 moderadas). Manifestos de dependências e lockfile não foram modificados por esta implementação. O relatório completo está em `dependency-audit.txt`; requer atualização e validação próprias antes de liberar uma versão.
- Skies: não aprovado neste repositório, que não possui `Skies.toml` nem `csm.toml`; o comando também tentou um build .NET sem projeto/solution. A configuração da Central de Marketing não configura automaticamente este app Expo/Node. Nenhum resultado foi tratado como verde.

## Navegador

O script `apps/mobile/scripts/guidance-smoke.cjs` abre Chromium isolado, bloqueia endereços externos e simula os contratos de API. Não usa a sessão real de Supabase. Os registros de fluxos, rotas e eventos estão nos arquivos JSON desta pasta; as capturas são PNGs. As pranchas `review-sheet-*.jpg` agrupam as 22 rotas para inspeção visual.

Cenários: ajuda dispensada/reaberta com retorno de foco; produto inválido, erro de rede e nova tentativa preservando rascunho; conclusão somente após sucesso; etiqueta com cancelamento e resolução de produto ausente; serviço salvo sem preço definido; financeiro com categoria incompatível tratada; precificação manual útil sem salvar; material criado dentro da ficha com retomada; suporte gratuito e limite de produto aplicado no salvamento.

Cobertura visual: 22 rotas em 390×844, seis áreas principais em 320×740 e 1280×900 no tema claro e 390×844 no tema escuro. Texto do cartão ampliado 150% em 320 px; a orientação permanece rolável e dispensável. Altura web 390×440 para verificar foco e acesso ao campo financeiro. O teste confere também a geometria: o campo inteiro deve caber na área rolável acima do rodapé, depois de renderizar a mensagem de erro. A ausência de rolagem horizontal externa é verificada pelo script; a revisão visual complementa essa checagem.

## Reproduzir

Em um terminal no repositório, inicie o Expo com variáveis de teste:

```powershell
$env:EXPO_NO_DOTENV='1'
$env:EXPO_PUBLIC_API_URL='http://localhost:3099'
$env:EXPO_PUBLIC_SUPABASE_URL='https://guidance-test.supabase.co'
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY='test-only-key'
pnpm --filter @lucro-caseiro/mobile exec expo start --web --port 8090 --offline
```

Em outro terminal, aponte `GUIDANCE_PLAYWRIGHT_PATH` para uma instalação local de Playwright que disponha de Chromium e execute:

```powershell
node apps/mobile/scripts/guidance-smoke.cjs
# Para repetir somente plano gratuito, texto ampliado e altura reduzida:
node apps/mobile/scripts/guidance-smoke.cjs --accessibility-only
# Para repetir somente as tarefas de cadastro, financeiro e preço:
node apps/mobile/scripts/guidance-smoke.cjs --flows-only
```

Não execute a revisão enquanto editar arquivos que provoquem Fast Refresh: isso pode reiniciar o formulário em teste. Use as mesmas variáveis de teste para gerar o PWA; o bundle resultante serve à validação e não deve ser publicado com esses endereços.

## Limites e próximos critérios de liberação

As simulações verificam o comportamento do cliente e o contrato esperado; os testes de API verificam persistência e autorização por mocks de repositório. Não houve teste integrado com Supabase real, envio de e-mail, pagamento ou publicação de catálogo em produção. Não houve homologação física Android/iOS, VoiceOver/TalkBack ou teclado nativo. A persistência da ajuda é por conta/aparelho, sem sincronização entre dispositivos.

Antes de uma liberação, resolver os checks pendentes e homologar os fluxos principais em aparelho real. A implementação não comprova melhora de retenção; essa conclusão depende das métricas após o lançamento descritas no documento de decisões.
