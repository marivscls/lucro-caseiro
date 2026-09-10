# Implementação das prioridades da landing

Revisão: 10 de setembro de 2026. O relatório original registra o diagnóstico anterior às mudanças.

| Prioridade                 | Correção                                                                                                                                                                             | Estado                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| P1 — rastreamento          | Raiz exata, páginas públicas e assets liberados; rotas internas continuam excluídas. Canonical da homepage consolidado em `/`; `/landing` redireciona com os parâmetros preservados. | Publicado e verificado por HTTP em produção  |
| P1 — HTTPS www             | Redirecionamento permanente para o domínio sem www implementado, incluindo remoção da porta interna.                                                                                 | Certificado pendente de infraestrutura       |
| P1 — catálogo dos planos   | Essencial e Profissional mostram catálogo completo e personalizado. Limites/preços vêm do contracts.                                                                                 | Implementado                                 |
| P1 — precificação avançada | Custos, trabalho, rateio por produção e taxas manuais descritos como recursos gerais. Profissional diferencia rateio por faturamento e perfis salvos.                                | Implementado                                 |
| P2 — continuidade web      | Navegador e Google Play nos três planos e no resultado da calculadora. A simulação pública é explicitamente local e não é transferida.                                               | Implementado e links conferidos no navegador |
| P2 — margem e markup       | Guia e exemplos distinguem percentual sobre custo e margem sobre venda; incluem gross-up e conferência do resultado.                                                                 | Implementado                                 |
| P2 — repetição da jornada  | Bloco redundante removido; capturas de precificação e catálogo não se repetem nos recursos. Cena reduzida de 340svh para 240svh em desktop; celular/tablet usam leitura linear.      | Implementado e revisão visual realizada      |
| P2 — medição               | Funil instrumentado com eventos sem valores financeiros; exemplo inicial não conta como resultado.                                                                                   | ID e recebimento na propriedade pendentes    |
| P2 — compartilhamento      | Imagem PNG própria 1200 × 630, Open Graph e Twitter nas nove páginas, descrição de disponibilidade em Android e navegador.                                                           | Implementado e HTTP verificado               |
| P3 — conteúdo              | Três guias ampliados, exemplos fechados, autoria, revisão editorial, referências do Sebrae, navegação e links relacionados.                                                          | Implementado                                 |

Também foram revisados H1 da calculadora, perguntas frequentes, suporte, identidade da operadora, explicação das métricas e documentação do produto.

## Validação

Checagem completa `pnpm prepush` aprovada na revisão isolada: lint, tipos, testes (45 na web, 829 no mobile), sherif e context:lint. Build de produção com Next.js 16.2.11 aprovado. As mesmas verificações HTTP passaram no domínio público após o deploy.

- Testes de redirecionamento, cabeçalhos e funil; regressão específica para não vazar a porta interna da hospedagem.
- Build de produção, lint e TypeScript da web.
- `node scripts/check-landing.mjs <base>` verifica as nove páginas, canonical, indexação, JSON-LD, CSP, redirecionamento, regras efetivas de robots, sitemap e dimensões do PNG.
- Revisão em 320, 390, 768, 1024 e 1440 pixels sem rolagem horizontal na landing. Calculadora e guia geral também conferidos em 320 pixels.
- Calculadora: exemplo R$ 74,25; taxa de 10% resulta em R$ 82,50 e sobra R$ 24,75; produção zero com custos fixos oculta o resultado; restauração recupera o exemplo.
- A verificação geral no workspace encontrou um erro de lint em alteração simultânea de `apps/mobile/src/features/home/components.tsx`. Essa alteração não integra a correção da landing; a revisão destinada à publicação deve ser verificada isoladamente.

## Dependências externas comprovadas

### Certificado de www

A Railway possui os domínios personalizados `lucrocaseiro.com.br` e `central.lucrocaseiro.com.br` no serviço web. A tentativa de adicionar `www.lucrocaseiro.com.br` retornou: “You have reached the limit for custom domains per service on your plan. Please upgrade to add more.” Nenhum domínio existente foi removido e nenhum plano foi contratado.

O DNS está na Hostinger (`artemis.dns-parking.com` e `hermes.dns-parking.com`); www atualmente aponta por CNAME para o domínio raiz. O painel da Hostinger apresentou login. Para concluir, é necessário liberar mais um domínio na Railway e concluir sua validação DNS, ou disponibilizar uma alternativa de redirecionamento HTTPS no provedor. Um redirecionamento de aplicação sozinho não corrige a negociação TLS anterior à requisição HTTP.

### Analytics

`NEXT_PUBLIC_GA_ID` não está configurado no serviço web da Railway. O Google Analytics apresentou uma sessão desconectada. É necessário informar o ID real `G-...` ou acessar a propriedade; configurar essa variável antes do build; publicar; verificar a carga de `gtag.js`, a requisição de coleta e a chegada dos eventos em Tempo real/DebugView.

Eventos: `pricing_section_view`, `calculator_first_edit`, `calculator_valid_result`, `start_web`, `start_android` e `calculator_to_app`. O parâmetro `placement` identifica o ponto de saída. Edição e resultado contam uma vez por visita à calculadora; resultado exige edição válida e 800 ms sem nova mudança. Restaurar o exemplo não cria resultado do visitante. Nenhum valor de custo, preço, lucro, contato ou cliente é enviado nesses eventos. URLs dos eventos próprios não contêm query string ou fragmento.

Cliques não comprovam cadastro, instalação nem ativação. O resultado de negócio deve ser acompanhado também pelas métricas de ativação já existentes no aplicativo. Não há dados suficientes nesta execução para afirmar aumento de conversão ou melhora de ranking.

## Publicação

Código publicado em `main`: `2c771a16dd245f1f559281eedb88ffb64d49b27f`.

Railway: deploy `5998487b-2573-451b-bbf8-0af4abb4a22d`, estado `SUCCESS` confirmado em 10 de setembro de 2026.

`node scripts/check-landing.mjs https://lucrocaseiro.com.br` aprovado: nove páginas HTTP 200, canonical correto, robots index/follow, CSP, JSON-LD válido, redirecionamento 308 de /landing para / preservando parâmetros, regras de rastreamento e sitemap corretos, imagem PNG 1200 × 630.

Em viewport 1280 × 720, os planos passaram da posição vertical aproximada de 6.660 px para 4.723 px: cerca de 29% menos rolagem até essa seção. Altura total observada: 7.674 px, ante 8.998 px no diagnóstico. Essas são medidas de layout, não resultados de conversão.

Oito das dez prioridades estão resolvidas e publicadas. HTTPS de www e coleta real do Analytics continuam pendentes das dependências externas descritas acima; não foram considerados concluídos.
