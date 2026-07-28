# Mockups canônicos — Operação acionável

**Status:** base visual para implementação e comparação
**Data:** 2026-07-24
**Relacionado:** `prd-operacao-acionavel-redesign.md`

Estes wireframes definem hierarquia e composição. Cores, tipografia, espaçamento e componentes
seguem `docs/designs/design-system/DESIGN.md` e os tokens de `packages/ui/src/theme.ts`.

## Regras comuns

- Mobile: 390×844, uma coluna e ação principal próxima do contexto.
- Tablet: 768×1024 e 1024×768, grid adaptativo sem criar outro produto.
- Desktop: 1440×1000, áreas operacionais realmente simultâneas.
- Uma única ação preenchida de rosa por viewport.
- Estados obrigatórios por superfície: carregando, vazio orientado, erro recuperável e dados.

## 1. Home

```text
MOBILE                         DESKTOP
┌ Hoje ───────────────────┐    ┌ Hoje / resultado ─────┬ Próximas ações ───┐
│ resultado + período     │    │ vendas e recebimentos │ alertas priorizados│
└─────────────────────────┘    ├───────────────────────┼───────────────────┤
┌ Próximas ações ─────────┐    │ Agenda de hoje        │ Estoque / contatos │
│ alerta → explicação → CTA│   │ linha do tempo        │ exceções           │
└─────────────────────────┘    └───────────────────────┴───────────────────┘
┌ Agenda / estoque ───────┐
└─────────────────────────┘
```

Vazio: ensinar a cadastrar o primeiro produto/serviço. Erro: manter atalhos e repetir somente o
bloco afetado.

## 2. Venda

```text
MOBILE                         DESKTOP
Cliente · Produtos · Pagar     ┌ Produtos / busca / estoque ┬ Resumo fixo ──┐
┌ busca + cards escaneáveis┐   │ cards e quantidades        │ cliente        │
│ estoque junto ao produto │   │                             │ subtotal       │
└──────────────────────────┘   │                             │ desconto       │
┌ desconto / observações ──┐   │                             │ total          │
└──────────────────────────┘   └─────────────────────────────┴ [Continuar] ──┘
┌ subtotal / desconto / total┐
└────────────── [Continuar] ─┘
```

Revisão mobile ocupa a tela e se comporta como comprovante. Pagamento e entrega nunca aparecem como
um único estado.

## 3. Produtos e estoque

```text
MOBILE                         DESKTOP
[Buscar sempre visível]        ┌ Lista/grid ─────────────┬ Detalhe ─────────┐
[Todos][Sem][Baixo][Rápido]    │ busca + filtros         │ foto, preço, saldo│
┌ foto nome       R$ ──────┐   │ foto nome preço saldo   │ [+ estoque]      │
│ categoria       2 un.    │   │ ...                     │ movimentações    │
│              [+ estoque] │   └─────────────────────────┴──────────────────┘
└──────────────────────────┘
```

Vazio respeita o filtro selecionado. Histórico diferencia venda, compra, ajuste, cancelamento e
produção.

## 4. Financeiro

```text
MOBILE                         DESKTOP
[Hoje][7 dias][Mês]            ┌ Indicadores + fluxo ────┬ Movimentações ───┐
┌ entradas × saídas ───────┐   │ entradas / saídas       │ histórico e busca │
└──────────────────────────┘   │ recebido / a receber    │                   │
┌ Alertas acionáveis ──────┐   ├ Alertas e vencimentos ──┤                   │
│ conta vencida  [Pagar]   │   │ ação por registro       │                   │
│ orçamento vence [Abrir]  │   └─────────────────────────┴───────────────────┘
└──────────────────────────┘
┌ Movimentações ───────────┐
```

Sem amostra suficiente, não há alerta de anomalia. O texto explica a base usada quando existir.

## 5. Orçamento

```text
MOBILE                         DESKTOP
Formulário por etapas          ┌ Formulário ──────────────┬ Prévia comercial ┐
→ revisão em tela cheia        │ cliente / itens          │ documento         │
┌ Custos internos ─────────┐   │ desconto / validade     │ sem custo/margem  │
│ custo · ganho · margem   │   │ custos internos         │ status            │
└──────────────────────────┘   └──────────────────────────┴───────────────────┘
Rascunho → Enviado → decisão
```

Custos internos nunca entram em PDF, mensagem ou prévia destinada ao cliente.

## 6. Agenda

```text
MOBILE                         DESKTOP
[semana rolável]               ┌ Calendário/linha do tempo ┬ Detalhe/edição ─┐
08:00  livre                   │ 08:00 livre               │ cliente/serviço  │
08:30  livre                   │ 09:00 ocupado             │ remarcar/lembrete│
09:00 ┌ Serviço · cliente ┐    │ 10:00 livre               │ histórico        │
10:00 └───────────────────┘    └───────────────────────────┴─────────────────┘
[Novo atendimento]
```

Cancelados não ocupam horário. Erro de conflito é apresentado junto ao horário escolhido.

## 7. Insights

```text
MOBILE                         DESKTOP/TABLET
O que fazer agora              ┌ Atenção ─────┬ Oportunidade ─┬ Tudo certo ─┐
┌ Atenção ────────────────┐    │ evidência    │ evidência     │ confirmação │
│ evidência + período     │    │ [ação]       │ [ação]        │             │
│ [ação]                  │    └──────────────┴───────────────┴─────────────┘
└─────────────────────────┘    Perguntas sugeridas + resposta baseada nos dados
[O que devo repor?]
[Onde perco margem?]
```

Não existe campo livre, avatar ou esfera de IA. Ausência de dados produz instrução de cadastro.

## 8. Vendas e encomendas

```text
MOBILE                         DESKTOP
[Vendas][Encomendas]           KPIs: vendido · recebido · a receber · abertas
┌ cliente · data ─────────┐    ┌ Cliente │ Data │ Valor │ Pagto │ Entrega │ ⋯ ┐
│ valor · pagamento      │    │ Ana     │ ...  │ ...   │ Pago  │ Pronta  │ ⋯ │
│ entrega (encomenda)    │    └───────────────────────────────────────────────┘
└────────────────────────┘    [período][pagamento][entrega][cliente][buscar]
```

Pagamento e entrega ocupam colunas independentes. A tabela cede para cards abaixo do breakpoint.

## 9. Catálogo

```text
MOBILE                         DESKTOP
Foto editorial forte           ┌ Hero editorial ─────────────────────────────┐
Nome + preço                   ├ Filtros / busca / ordenação ────────────────┤
[Pedir pelo WhatsApp]          │ foto forte │ foto forte │ foto forte        │
[categoria][ordem]             │ nome preço │ nome preço │ nome preço        │
cards em uma coluna            └──────────────────────────────────────────────┘
```

O detalhe preserva foto, descrição, variações, preço e CTA. Sem avaliações, mapas ou aparência de
marketplace genérico.

## Matriz de prova

| Superfície | Mobile | Tablet retrato | Tablet paisagem | Desktop | Vazio | Erro |
| --- | --- | --- | --- | --- | --- | --- |
| Home | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Venda | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Produtos | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Financeiro | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Orçamento | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Agenda | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Insights | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Vendas | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |
| Catálogo | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |

## Matriz de comparação executada

| Superfície | Referência adotada | Captura real correspondente |
| --- | --- | --- |
| Home | dashboards modulares | `.aerofortress/tmp/design-audit/desktop-home.png` |
| Venda | Ecomiq Order Creation/Mobile Flow | `.aerofortress/tmp/design-audit/mobile-new-sale-products.png` |
| Produtos/Estoque | StockIt/KYROBAR/Ecomiq | `.aerofortress/tmp/design-audit/mobile-products.png` |
| Financeiro | Transactions/Lightweight Finance | `.aerofortress/tmp/design-audit/desktop-finance.png` |
| Orçamento | Invoice Maker/Flowly | `.aerofortress/tmp/design-audit/desktop-quotes-form.png` |
| Agenda | Beauty Booking/Travel Itinerary | `.aerofortress/tmp/design-audit/mobile-agenda-timeline.png` |
| Insights | Business Analytics/Smart Production | `.aerofortress/tmp/design-audit/mobile-insights-actions.png` |
| Vendas web | Motoserv Work Orders | `.aerofortress/tmp/design-audit/desktop-sales.png` e `desktop-orders.png` |
| Catálogo | Real Estate/Fashion editorial | `.aerofortress/tmp/design-audit/desktop-catalog.png` |

As fontes recuperadas e as decisões “adotar/adaptar/recusar” ficam na matriz de
`design-inspiracoes-operacionais.md`; esta tabela liga cada referência à composição real executada.
