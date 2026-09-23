# Implementação das prioridades da landing

Revisão: 10 de setembro de 2026. O relatório original registra o diagnóstico anterior às mudanças.

| Prioridade                 | Correção                                                                                                                                                                             | Estado                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| P1 — rastreamento          | Raiz exata, páginas públicas e assets liberados; rotas internas continuam excluídas. Canonical da homepage consolidado em `/`; `/landing` redireciona com os parâmetros preservados. | Publicado e verificado por HTTP em produção  |
| P1 — HTTPS www             | Certificado Railway válido; www usa a vaga disponível da API e redireciona diretamente ao domínio principal, preservando caminho e parâmetros.                                       | Publicado e verificado em produção           |
| P1 — catálogo dos planos   | Essencial e Profissional mostram catálogo completo e personalizado. Limites/preços vêm do contracts.                                                                                 | Implementado                                 |
| P1 — precificação avançada | Custos, trabalho, rateio por produção e taxas manuais descritos como recursos gerais. Profissional diferencia rateio por faturamento e perfis salvos.                                | Implementado                                 |
| P2 — continuidade web      | Navegador e Google Play nos três planos e no resultado da calculadora. A simulação pública é explicitamente local e não é transferida.                                               | Implementado e links conferidos no navegador |
| P2 — margem e markup       | Guia e exemplos distinguem percentual sobre custo e margem sobre venda; incluem gross-up e conferência do resultado.                                                                 | Implementado                                 |
| P2 — repetição da jornada  | Bloco redundante removido; capturas de precificação e catálogo não se repetem nos recursos. Cena reduzida de 340svh para 240svh em desktop; celular/tablet usam leitura linear.      | Implementado e revisão visual realizada      |
| P2 — medição               | Propriedade e fluxo GA4 criados; ID publicado; Google detectou a tag; requisições de coleta observadas no navegador.                                                                 | Coleta confirmada; validar cliques de saída  |
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

## Infraestrutura e medição

### Certificado de www

A Railway possui os domínios personalizados `lucrocaseiro.com.br` e `central.lucrocaseiro.com.br` no serviço web, que atingiu o limite do plano. A solução aproveitou a segunda vaga disponível no serviço existente `@lucro-caseiro/api`. Nenhum domínio existente foi removido, nenhum serviço foi criado e nenhum plano foi contratado.

Na Hostinger, `www` foi atualizado para CNAME `i9h4va6n.up.railway.app`, TTL 300, e foi adicionado o TXT `_railway-verify.www` exigido pela Railway. O servidor autoritativo `artemis.dns-parking.com` confirmou o novo destino. A Railway confirmou propriedade verificada e certificado `VALID`, válido até 9 de dezembro de 2026 e gerenciado pelo provedor. Registros de e-mail, domínio principal e aplicativo foram preservados.

O middleware da API trata exclusivamente `www.lucrocaseiro.com.br`: GET/HEAD recebem 308 para a origem fixa `https://lucrocaseiro.com.br`; `/landing` vai diretamente a `/`; caminhos e query strings são preservados. Outros métodos recebem 405 nesse alias. Os oito testes HTTP cobrem redirecionamentos, destino fixo, preservação das rotas da API e recusa de escrita. O endpoint de saúde da API continua respondendo `ok`.

A opção de redirecionamento gratuito da Hostinger foi descartada após recusar o destino raiz como equivalente ao www. O destino alternativo via `/landing` não foi aplicado. A emissão de SSL solicitada na Hostinger permaneceu em instalação na última consulta; ela não é usada no tráfego do site, cujo certificado ativo está na Railway.

### Analytics

Criada a propriedade **Lucro Caseiro**, ID `553582084`, na conta já autenticada `256889171`, com moeda BRL e fuso São Paulo. Criado o fluxo **Lucro Caseiro — site público**, ID `15754755181`, URL `https://lucrocaseiro.com.br`, medição otimizada extra desativada conforme autorização do usuário para usar os eventos próprios do site.

`NEXT_PUBLIC_GA_ID=G-ZLQE9DXQB9` foi configurado no serviço web de produção antes do novo build. Deploy `ed5d99f3-be75-48d8-b34b-8ba477f22ad0` confirmado como `SUCCESS`. O bundle público contém o ID correto e a fila `gtag` usa o formato esperado de argumentos. O teste oficial do Google informou **“A tag do Google foi detectada no seu site.”** O inventário de recursos do navegador confirmou `gtag.js` e requisições `fetch` para `/g/collect`, com `tid=G-ZLQE9DXQB9`, evento `page_view`, URL da calculadora sem query/fragmento e personalização de anúncios desativada (`npa=1`). Não foram armazenados identificadores de visitantes nas evidências do repositório.

Na primeira consulta, Tempo real não mostrou eventos. Na rechecagem em 10/09/2026, aproximadamente às 15h33 (São Paulo), o fluxo passou a informar **“Recebendo tráfego nas últimas 48 horas”** e **“A coleta de dados esteve ativa nas últimas 48 horas”**. Em Administrador → Eventos → Eventos recentes, foram observados `calculator_first_edit`, `calculator_valid_result`, `first_visit`, `page_view`, `pricing_section_view`, `session_start` e `user_engagement`, todos associados ao fluxo público. Isso confirma recebimento e processamento na propriedade, sem nova alteração de código ou configuração.

O filtro `Internal Traffic` está no estado **Teste**, não excluindo tráfego. O Tag Assistant oficial confirmou o destino `G-ZLQE9DXQB9` e um hit `page_view` com `_dbg=1`, sem mensagens no console. Tempo real e DebugView ainda estavam vazios na mesma investigação; o motivo dessa diferença não foi comprovado. A lista de eventos recentes é evidência de coleta, mesmo com os painéis de atividade atual vazios. `start_web`, `start_android` e `calculator_to_app` ainda não apareceram nessa lista; a validação individual desses cliques permanece pendente. Foi solicitado um teste no celular do usuário para comparar com o navegador de diagnóstico.

Eventos: `pricing_section_view`, `calculator_first_edit`, `calculator_valid_result`, `start_web`, `start_android` e `calculator_to_app`. O parâmetro `placement` identifica o ponto de saída. Edição e resultado contam uma vez por visita à calculadora; resultado exige edição válida e 800 ms sem nova mudança. Restaurar o exemplo não cria resultado do visitante. Nenhum valor de custo, preço, lucro, contato ou cliente é enviado nesses eventos. URLs dos eventos próprios não contêm query string ou fragmento.

Novo teste executado pelo agente aproximadamente às 15h40: alterar a taxa para 10% produziu R$ 82,50, taxa de R$ 8,25 e sobra de R$ 24,75. O botão do resultado abriu o aplicativo web e o botão Android abriu a página correta do Lucro Caseiro na Play Store. O bundle de produção contém o ID correto, o listener dos cliques e os três eventos de saída. A lista de eventos recentes permaneceu com os sete nomes acima após esses testes; navegação funcional aprovada, recebimento dos eventos de saída ainda não comprovado. A checagem HTTP das nove páginas e dos três redirecionamentos www passou novamente.

Na validação seguinte, aproximadamente às 15h44, a sessão original do Tag Assistant (`?restart_tag_assistant`) mostrou os registros completos que não estavam visíveis na outra janela de diagnóstico: `calculator_first_edit`, `calculator_valid_result`, duas saídas `start_web`, uma saída `start_android` e os respectivos `calculator_to_app`. Todos apareceram em **Hits enviados** para `G-ZLQE9DXQB9`. O detalhe de `start_android` confirmou endpoint `/g/collect`, `ep.placement=calculator_result`, URL pública da calculadora e `_dbg=1`. As duas saídas web correspondem aos dois cliques de teste realizados. O envio dos três eventos de saída está validado; sua presença nos relatórios do GA4 ainda não foi observada. O aviso de desconexão do Tag Assistant informava que a janela de depuração havia sido fechada, não uma falha de envio.

Cliques não comprovam cadastro, instalação nem ativação. O resultado de negócio deve ser acompanhado também pelas métricas de ativação já existentes no aplicativo. Não há dados suficientes nesta execução para afirmar aumento de conversão ou melhora de ranking.

## Publicação

Código publicado em `main`: `2c771a16dd245f1f559281eedb88ffb64d49b27f`.

Railway: deploy `5998487b-2573-451b-bbf8-0af4abb4a22d`, estado `SUCCESS` confirmado em 10 de setembro de 2026.

`node scripts/check-landing.mjs https://lucrocaseiro.com.br` aprovado: nove páginas HTTP 200, canonical correto, robots index/follow, CSP, JSON-LD válido, redirecionamento 308 de /landing para / preservando parâmetros, regras de rastreamento e sitemap corretos, imagem PNG 1200 × 630.

Em viewport 1280 × 720, os planos passaram da posição vertical aproximada de 6.660 px para 4.723 px: cerca de 29% menos rolagem até essa seção. Altura total observada: 7.674 px, ante 8.998 px no diagnóstico. Essas são medidas de layout, não resultados de conversão.

Correção de infraestrutura publicada em `main`: `18bb5461ee031678acb2cd4cf475facb45765154`; deploy API `276a43a2-8516-481b-8c41-fd81ef50bb4c`, `SUCCESS`. `pnpm prepush` passou na cópia isolada desse commit, incluindo 866 testes da API. O workspace principal tem mudanças simultâneas do mobile que não integram essa publicação.

A checagem de produção passou novamente após a configuração: nove páginas públicas corretas e três redirecionamentos HTTPS do www com validação normal de certificado, incluindo preservação de parâmetros. O script agora verifica www automaticamente quando a base é o domínio de produção.

Nove das dez prioridades estão resolvidas e publicadas. A coleta do Analytics está confirmada na propriedade, incluindo visitas, visualização dos planos e interações da calculadora. O envio dos três eventos de saída também foi validado no Tag Assistant. A prioridade de medição permanece em validação parcial apenas quanto à presença desses cliques nos relatórios do GA4; não há evidência para atribuir os painéis de tempo real vazios a uma falha geral de coleta.
