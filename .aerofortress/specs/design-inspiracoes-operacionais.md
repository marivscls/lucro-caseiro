# Especificação — Reaproveitamento rigoroso das inspirações operacionais

**Status:** implementado; validação controlada concluída e validação com conta real bloqueada
**Data:** 2026-07-24
**Responsável:** Lucro Caseiro

## Problema

As referências internacionais foram inicialmente convertidas em seis grupos funcionais, mas a
entrega não preservou os links/capturas, não registrou quais padrões visuais seriam adaptados e não
produziu comparação visual das telas alteradas. Assim, mudanças incrementais no código foram
apresentadas como implementação integral das inspirações.

## Objetivo

Reaproveitar somente padrões que melhoram clareza, velocidade e confiança nos fluxos do Lucro
Caseiro, sem copiar paletas, criar módulos paralelos ou introduzir itens do grupo excluído.

Cada padrão precisa seguir a cadeia:

`referência → princípio aproveitável → adaptação à marca → tela/estado → prova visual`

## Design canônico que prevalece

- Fonte da verdade executável: `packages/ui/src/theme.ts`.
- Tipografia: Fraunces para display/h1/h2; Nunito Sans para texto, controles e números.
- Canvas neutro quente; rosa como ação primária, seleção, link ou momento de marca.
- No máximo um elemento preenchido de rosa por viewport.
- Cards operacionais flat, opacos, com raio da escala e borda hairline.
- Verde comunica dinheiro positivo; âmbar, atenção; vermelho, problema.
- Sombras somente pelos tokens do tema e apenas quando a hierarquia realmente exige elevação.
- Layout desktop não pode ser o mobile esticado.

Em caso de conflito, `docs/adr/0007-linguagem-visual-flat-unificada.md`,
`docs/adr/0008-tipografia-fraunces-nunito-sans.md` e os tokens executáveis prevalecem sobre
mockups/documentos antigos.

## Matriz das referências altas

| Área | Referências recuperadas | Padrões adotáveis | Não copiar / fora do escopo | Prova exigida |
| --- | --- | --- | --- | --- |
| Venda | [Ecomiq Order Creation](https://dribbble.com/shots/26709622-Ecomiq-Mobile-Order-Creation-Flow-for-E-Commerce), [Ecomiq Mobile Order Flow](https://dribbble.com/search/order-flow), [Mobile Order Flow](https://dribbble.com/shots/26398407-Mobile-Order-Flow), Payment Checkout e Parking Payment (fonte exata não preservada) | Cliente antes dos itens; estoque na seleção; total persistente; “receber depois”; revisão agrupada; sucesso com acesso ao comprovante/compartilhamento | Carteira, cartão salvo, mapa/estacionamento e estética fintech | 4 etapas, estoque normal/baixo/zerado, pagamento imediato/posterior, revisão e sucesso |
| Produtos | [Ecomiq Add Product](https://dribbble.com/search/add-product-ecommerce), [Ecomiq Product Management](https://dribbble.com/shots/25731055-Ecomiq-Product-Management-Dashboard-for-SaaS-E-commerce), [Smart Production](https://dribbble.com/shots/27129588-Smart-Production-From-Sampling-to-Profitability) | Seções progressivas; categoria inline; foto; custo/ganho ao vivo; estoque e status claros; revisão antes de persistir | Dropshipping, publicação multicanal e dashboard industrial denso | Criar/editar, custo ausente/presente, estoque livre/controlado, produto simples/composto |
| Financeiro | [Transactions Management](https://dribbble.com/shots/27255983-Transactions-Management-Dashboard), Lightweight Finance (fonte exata não recuperada) | Hoje/7 dias/Mês; entradas/saídas/resultado; recebido/a receber; gráfico comparativo; movimentações; alertas operacionais | Conta bancária, carteira, transferências e metas de investimento | Períodos, vazio/com dados, encomendas a receber, vencidos e responsividade |
| Orçamentos | Flowly (fonte original não preservada), [Invoice Maker](https://dribbble.com/search/invoice-mobile-app), [Invoice Management](https://dribbble.com/shots/26322717-Smart-Invoice-Management-App-UI) | Criação guiada; catálogo; prévia; estados legíveis; ação principal por estado; compartilhar; converter sem redigitar | Cobrança bancária, QR de pagamento e fiscalidade estrangeira | Rascunho/enviado/aprovado/recusado/expirado, prévia, WhatsApp e conversão |
| Agenda | [Beauty Service Booking](https://dribbble.com/shots/26122853-Beauty-Service-Booking-App-Modern-Elegant-UI), Service Booking (fonte exata não preservada), [Patient Portal](https://dribbble.com/shots/27210090-Custom-Healthcare-Patient-Portal-Mobile-App-Design) | Faixa de datas; hora em destaque; cliente/serviço/valor; status; próxima ação; histórico do cliente | Marketplace, mapas, avaliações, busca de profissionais e videochamada | Hoje/semana, vazio/com compromissos, cada status, remarcação e lembrete |
| Insights | [Business Analytics F&B](https://dribbble.com/shots/27140783-Business-Analytics-Dashboard-UI-F-B-Management-System), Smart Production, Construction Cost Dashboard (fonte exata não recuperada) | Indicador → explicação → ação; reposição; margem baixa; receita vs despesa; custo previsto/realizado; desperdício | Painel corporativo denso, multiunidade e IA genérica | Dados suficientes/insuficientes, cada regra, ação de destino e plano |

## Matriz das referências médias

Referências médias não criam projetos nem rotas próprias. Seus padrões entram somente quando a
tela correspondente já está sendo alterada.

| Referência | Aplicação permitida | Critério observável |
| --- | --- | --- |
| [Legal Finalize](https://dribbble.com/shots/27362395-Legal-Finalize-Mobile-App) | Orçamentos e comprovantes | Prévia legível, status explícito e próxima ação inequívoca |
| [Travel Itinerary](https://dribbble.com/shots/22874605-Itinerary-Planner-Mobile-Application-UI-Design) | Agenda | Sequência cronológica escaneável; sem recursos de viagem |
| Real Estate / Fashion (fontes exatas não preservadas) | Catálogo | Foto, nome, preço e ação com hierarquia editorial; sem marketplace |
| [LoopAI](https://dribbble.com/shots/26290653-LoopAI-Dashboard-Design-for-B2B-CRM) | Agenda/clientes | Próximo contato ou lembrete contextual; sem CRM/funil B2B |
| [Meeting Cost Calculator](https://dribbble.com/shots/3037346-Meeting-Cost-Calculator) | Precificação | Mostrar impacto de custo no resultado em tempo real |
| [Logistics Quote Results](https://dribbble.com/shots/27193463-Logistics-Fleet-Management-AI-Freight-Automation-Dashboard) | Precificação | Comparar cenários por preço, ganho e margem; sem logística |
| [Asivest](https://dribbble.com/shots/26388617-Asivest-Investment-Tools-and-Learn-Dashboard) | Precificação | Conteúdo educativo junto ao cálculo; sem investimentos |
| Dashboards modulares | Home e PWA desktop | Blocos independentes, ordem por decisão diária e densidade responsiva |

## Exclusões obrigatórias

Não implementar, nem por analogia visual:

- conta bancária, carteira, cartões, transferências ou investimentos;
- CRM B2B, funil comercial ou gestão de funcionários;
- marketplace, mapas, distância, avaliações ou videochamada;
- logística/rastreamento completo, dropshipping ou marketplaces externos;
- publicidade, aquisição, chat de IA genérico;
- dashboards corporativos densos;
- dark mode ou glassmorphism como identidade principal.

## Critérios de aceite por tela

1. O caminho até a melhoria é visível a partir da navegação atual.
2. A melhoria não depende de conhecimento oculto nem de dado impossível de produzir.
3. Estados normal, vazio, carregando, erro e condicionado por plano são coerentes.
4. Contraste, alvos de toque, leitura numérica e foco web permanecem acessíveis.
5. Capturas em 390×844 e 1440×1000 demonstram a composição real.
6. A captura é comparada à referência e ao mockup canônico, registrando adotado/descartado.
7. Mockups alterados refletem a mesma ordem e hierarquia do código.
8. Typecheck, lint, testes e build PWA passam depois da validação visual.

## Bloqueios conhecidos

- A conta em `apps/mobile/.maestro/.env` respondeu HTTP 400 no login em 2026-07-24. Capturas
  autenticadas novas não podem ser declaradas concluídas até existir sessão E2E válida.
- Algumas fontes exatas da auditoria original não foram preservadas. Elas permanecem explicitamente
  marcadas nesta matriz; resultados semelhantes de busca não substituem a fonte original.

## Resultado observado em 2026-07-24

- Venda: cliente antes dos itens, estoque normal/baixo visível na seleção, total persistente,
  pagamento posterior, revisão e atalho ao recibo/WhatsApp.
- Produtos: criação e edição em seções, categoria inline, ganho/margem durante o preenchimento e
  revisão antes de persistir. Seletores usam rosa suave; a ação principal é o único bloco rosa.
- Financeiro: Hoje/7 dias/Mês, resultado, comparação proporcional de entradas/saídas, recebido/a
  receber e alerta acionável de saldo negativo.
- Orçamentos: catálogo, revisão, estados persistidos Rascunho/Enviado/Aprovado/Recusado, WhatsApp e
  conversão em encomenda. Migração `042_quote_lifecycle.sql` converte o legado `pending`.
- Agenda: faixa de sete dias, sequência cronológica, cliente/valor/status, WhatsApp, remarcação por
  edição e atalho ao histórico do cliente.
- Insights: indicador → explicação → ação; queda de faturamento, reposição, margem baixa e custo
  previsto × realizado/desperdício somente quando existe fechamento real de produção.
- Referências médias: prévia/status em documentos, cronologia na agenda, hierarquia editorial do
  catálogo, contato contextual, impacto do custo e três cenários de preço, além de módulos em duas
  colunas na Home e em Orçamentos no desktop.

### Prova visual controlada

As telas foram montadas com o PWA compilado e respostas de API simuladas localmente, sem escrita
externa, em 390×844 e 1440×1000. O roteiro registrou zero erros de console/runtime.

- Diretório: `.aerofortress/tmp/design-audit/`
- Matriz de resultados: `.aerofortress/tmp/design-audit/results.json`
- Estados adicionais: `mobile-new-sale-products.png`, `mobile-quotes-review.png`,
  `desktop-quotes-form.png`, `mobile-agenda-timeline.png`, `mobile-agenda-detail.png`,
  `desktop-orders.png`, `mobile-insights-actions.png` e `mobile-products-edit.png`.

Essa prova confirma montagem, hierarquia e responsividade. Ela não substitui a revalidação com a
conta E2E real, ainda bloqueada pelo login HTTP 400.

### Validação técnica

- `pnpm typecheck`: passou.
- `pnpm lint`: passou sem erros; 24 avisos preexistentes na API.
- `pnpm test`: 51 arquivos/656 testes da API, 61/378 do mobile e 4/9 da web passaram.
- `pnpm context:lint`: passou.
- build PWA `lucro-caseiro`: passou.
