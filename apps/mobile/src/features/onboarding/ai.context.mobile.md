# Onboarding e perfil do negócio

## Purpose

Aprovado em 2026-09-04: a prévia foi integrada ao primeiro acesso real do Lucro Caseiro. O mesmo formulário de cinco etapas é usado em `/onboarding`, no cartão do Início e em Configurações → Perfil do negócio. As outras marcas mantêm o onboarding anterior.

## API Integration

- Nome, nome do negócio e tipo são gravados pela API de perfil existente. Segmentos são mapeados para o enum já aceito: confeitaria → food, artesanato → crafts, revenda → other.
- Segmento específico, momento, canais e prioridade ficam em `user_metadata.business_onboarding` do Supabase Auth, com versão 1 e status `completed` ou `dismissed`. São preferências do próprio usuário, nunca autorização ou permissões. Não exigem migração de banco.
- As duas escritas são sequenciais: só há confirmação e navegação quando ambas terminam. Se a segunda falhar, os campos básicos podem já estar atualizados, mas o formulário continua aberto com o rascunho e uma ação de nova tentativa.
- `onboarding_completed: true` significa que o primeiro acesso foi resolvido, inclusive por dispensa. O status detalhado distingue dispensa de conclusão. A decisão local por userId também é atualizada após sucesso para não depender de atualização do JWT.
- Ao abrir, as preferências são buscadas na conta. Cache de preferências e de perfil são separados por userId. Troca de conta durante o salvamento impede a gravação de preferências na nova sessão.
- “Agora não”, fechar o primeiro fluxo e voltar no Android persistem a dispensa quando ainda não há decisão. A edição posterior não apaga respostas salvas ao cancelar. Rascunhos não concluídos não são persistidos.
- Dados fictícios da prévia anterior não são migrados. O store mockado foi removido.

## Components

- O Início mostra a recomendação da prioridade selecionada, com navegação para precificação, venda, agenda, financeiro, catálogo ou cadastro de serviço.
- Ideias para divulgar: orientações determinísticas e recolhíveis para cada canal selecionado, adaptadas ao segmento. Não enviam mensagens, não publicam conteúdos e não fazem chamadas de IA.
- `useBusinessCopy` reaproveita o tipo canônico e especializa serviços, peças de artesanato e exemplos de confeitaria. Marcas verticais mantêm seus próprios termos.
- “Primeiros passos” permanece separado. Depois da decisão de perfil, fica disponível sob demanda. O guia de produtos não é exibido para prestadores de serviço.
- O convite de demonstração foi retirado do Início. A recomendação só aparece após concluir; o acesso continua em Configurações. Contas antigas não são forçadas a responder novamente.

## Performance

Reaproveita o design compacto aprovado: Manrope, paleta da marca, ilustrações existentes, perguntas de 26/32 px, opções com altura mínima de 72 px e ações de 48 px. Alturas flexíveis, conteúdo rolável, foco visível, suporte a fonte ampliada e redução de movimento. Estados de carregamento, erro e salvamento; entradas e ações bloqueadas durante a gravação.

O formulário `business-profile-form.tsx` é compartilhado pelo fluxo real. A composição e a persistência ficam em `business-profile.tsx` e `use-business-onboarding.ts`.

## Test matrix

Testes cobrem validação, mapeamento de segmentos, recomendações/canais, falhas de API e Auth, nova tentativa, dispensa remota, isolamento e troca de conta, textos personalizados e regressão do guia anterior. Revisão visual na prévia web usando a leitura do perfil existente, sem gravar dados fictícios na conta. Publicação de produção não executada.

## Non-goals

Não altera planos, permissões ou cobrança. Não publica divulgações nem substitui o guia de ativação. Não migra respostas fictícias da prévia.

## Boundaries & Ownership

Onboarding coleta preferências; subscription mantém nome e tipo canônicos; Auth persiste a decisão de primeiro acesso. Home consome a recomendação, e Configurações oferece edição.

## Code pointers

- `business-profile.tsx`: composição de fluxo e cartão.
- `business-profile-form.tsx`: formulário compartilhado.
- `profile-data.ts`, `profile-visuals.tsx`: escolhas, recomendações e elementos visuais.
- `business-profile-data.ts`: validação, mapeamento e persistência coordenada.
- `use-business-onboarding.ts`: leitura e salvamento vinculados à conta.

## Hooks

`useBusinessOnboarding` consulta a conta, expõe carregamento/erro/salvamento e impede envio duplicado. `useProfile` e `useUpdateProfile` fornecem os campos canônicos. `useBusinessCopy` adapta exemplos ao segmento.

## Contracts

Usa `UpdateProfile` e `UserProfile` dos contratos existentes. `BusinessOnboarding` possui `version: 1`, `status: completed | dismissed` e respostas validadas de segmento, estágio, canais e objetivo. `BusinessProfileAnswers` também contém nome e negócio para o formulário.

## Error Handling

Falha em qualquer escrita mantém o formulário aberto e o rascunho disponível. Carregamento malsucedido oferece nova tentativa. Nunca marca conclusão apenas por ter alterado o perfil básico. Verifica a identidade antes da atualização de Auth.

## Examples

Artesanato com prioridade de preço destaca a precificação de uma peça. Serviços com prioridade de organização abrem a agenda. Canais WhatsApp e Instagram produzem duas ideias distintas de divulgação. Uma conta dispensada mantém a edição disponível em Configurações.

## Change log / Decisions

- 2026-09-04: prévia convertida em fluxo real com persistência por conta e layout compacto.
- 2026-09-04: removidos nomes e convite de demonstração; Início só mostra o cartão personalizado após conclusão. A edição continua em Configurações.

## Orientação contextual — 2026-09-07

Home preserva prioridade do BusinessProfileCard e perfil recente. Orientação geral só preenche ausência de prioridade e é suspensa durante guia anterior. Não atribuir abandono histórico à personalização recente.

Contrato e matriz: `docs/orientacao-contextual-primeiro-valor.md`; composição: `shared/guidance`.

- 2026-09-09: transições do perfil usam 360 ms e deslocamento horizontal de 36 px, invertido ao voltar. O onboarding das outras marcas compartilha o mesmo padrão; dados e salvamento permanecem imediatos, com movimento reduzido respeitado.

- 2026-09-23: salvar o perfil emite `business_profile_completed` (segmento, estágio, objetivo e
  quantidade de canais) ou `business_profile_skipped`, com `first` indicando a primeira decisão.
  Nome e nome do negócio não são enviados.

## Modo demonstração (sem servidor) — 2026-09-23

Build-time, para revisar layouts do primeiro acesso sem API, Supabase, anúncios ou compras.
Ligado só com `EXPO_PUBLIC_MOCK_MODE=1`; sem a flag, `isMockMode` é `false` e o app segue
o caminho de produção (os módulos simulados nem são avaliados).

- Gerar: `pnpm --filter @lucro-caseiro/mobile export:demo` (saída em `apps/mobile/dist/demo`;
  aceita `-- --output-dir <pasta>`). O script remove do `index.html` o registro do service
  worker e o `push-worker.js`. Site estático na raiz da própria origem, com SPA fallback.
- Código em `apps/mobile/src/shared/mock/`: `mode.ts` (flag), `auth.ts` (cliente Supabase
  falso: auth + storage), `api.ts` (rotas em memória), `fixtures.ts` (confeitaria "Doces da
  Ana"), `db.ts`/`storage.ts` (estado por conta no localStorage com prefixo `lucro-demo:`),
  `reset.ts` e `boot.ts` (primeiro import de `app/_layout.tsx`).
- Auth: qualquer e-mail e senha funcionam após ~600 ms. Cadastro cria conta nova e vazia
  (boas-vindas → cadastro → perfil do negócio → Início sem vendas → primeira venda). Entrar
  com e-mail ainda não cadastrado cria uma conta antiga com os dados de exemplo (produtos,
  clientes, vendas com fiado, despesas, agenda). Google entra sempre na mesma conta de
  demonstração (nova na primeira vez). Sair encerra a sessão local.
- API: `api-client.ts` chama `mockApiRequest` em vez do `fetch`; status de erro viram
  `ApiError` como na rede. Criar produto, cliente, venda (fiado nasce pendente; paga gera
  entrada no financeiro e baixa estoque), encomenda e lançamento altera o estado da conta.
  Rotas sem mock respondem vazio (lista que também tem `items/total/page/limit/totalPages`)
  ou ecoam a escrita, e aparecem no console como `[demo] rota sem mock: ...` para serem
  preenchidas depois. Coleta de uso, relatórios de erro e push token são no-op. Checkout de
  assinatura responde "Assinaturas ficam desativadas no modo demonstração.".
- Desligados: anúncios (`ensureAdsInitialized`/`useShowAds`), compras na loja
  (`react-native-iap` não carrega), pedidos de permissão e registro de push (nativo e
  navegador), avaliação na loja, NetInfo (sempre online) e a fonte remota dos HTMLs exportados.
- `?reset=1` apaga o localStorage/sessionStorage da origem (inclui AsyncStorage no web e o
  estado simulado) e recarrega sem o parâmetro, para repetir o primeiro acesso.
- Fora do mock: leitor de código de barras no web (o expo-camera baixa o jsQR de CDN),
  página pública do catálogo, exportação PDF/Excel do financeiro e upload real de imagens
  (a foto vira URL local da sessão).
- Testes: `shared/mock/api.test.ts`, `auth.test.ts` e `reset.test.ts`.
