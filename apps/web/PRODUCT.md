# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas que produzem, vendem ou prestam serviços por conta própria ou em negócios pequenos e em crescimento: autônomas, MEIs, produtoras, comerciantes. Confeitaria, marmitas, salgados, artesanato, papelaria, costura, beleza e revenda são segmentos de entrada, não limites. Operam principalmente pelo celular, divulgam e atendem por WhatsApp e Instagram, têm pouco tempo, controles espalhados (caderno, planilha, conversas) e receio de sistemas complicados. Idades variadas, inclusive quem nunca usou app de gestão.

Situações que acionam a busca: definir o preço de um produto novo; perceber que vende mas o dinheiro não sobra; ingredientes ou materiais subiram; querer dar desconto sem perder dinheiro; querer um catálogo mais profissional; cansaço de repetir cadastros; pedidos e cobranças perdidos no WhatsApp.

Dores em palavras da própria pessoa: "Não sei se estou cobrando certo." "Vendo bastante, mas nunca sobra." "Não sei quanto vale o meu tempo." "Sempre esqueço algum custo." "Está tudo no caderno e no WhatsApp." "Não quero aprender um sistema complicado."

A landing pública fala com o mercado amplo (qualquer autônoma ou MEI que produz ou vende), não com um único nicho. Confirmado pela dona do produto em 2026-09-02.

## Product Purpose

App de gestão (Android hoje; web e iOS previstos) que transforma custo em preço, preço em produto e catálogo, e catálogo em venda, sem chute e sem retrabalho. Sucesso é o "negócio ativado": a pessoa conclui a precificação de um produto, transforma o cálculo em produto e publica no catálogo ou registra uma venda com os mesmos dados. A métrica principal é negócios ativados, não downloads.

## Positioning

Um único fluxo em que a informação anda com a pessoa: o que ela digita na precificação vira produto, catálogo com link próprio e venda registrada, sem recadastro. Concorrentes de gestão (Kyte etc.) cobram e organizam; o Lucro Caseiro começa pela conta do preço e explica custo, preço e lucro em português simples, em até 3 toques por ação principal.

## Operating Context

- Uso pelo celular, em pé, na correria da produção ou do atendimento.
- Pedidos chegam e são combinados no WhatsApp; o catálogo público (`catalogo.lucrocaseiro.com.br/c/<slug>`) inicia o pedido pelo WhatsApp.
- Custos sensíveis por segmento: ingredientes/materiais fracionados, embalagem, gás e energia, tempo de produção, taxas de cartão/app, perdas e refação.
- Funciona offline com sincronização posterior.
- Fórmula de preço compartilhada por app, API e web em `@lucro-caseiro/contracts` (`pricing-calculator.ts`): custo = insumos + embalagem + mão de obra (minutos × valor da hora) + rateio de fixos; preço sugerido = custo × (1 + margem); taxas com gross-up.

## Capabilities and Constraints

Confirmado e publicado: precificação completa com histórico; produtos com foto, preço, custo e estoque; receitas com custo automático; embalagens e rótulos; catálogo online com link e pedido pelo WhatsApp; vendas com status (pago, pendente, cancelado); clientes com aniversário e histórico; agenda de encomendas; fiado; financeiro com entradas, saídas e resumo mensal; alertas de estoque e cobrança; offline.

Planos (fonte: `docs/planos-comerciais.md`): Gratuito R$ 0 (30 vendas/mês, 20 clientes, 15 produtos, 5 receitas, 3 embalagens, catálogo básico); Essencial R$ 29,90/mês ou R$ 299/ano (vendas, clientes e produtos ilimitados, agenda, fiado, financeiro, resumo em PDF); Profissional R$ 69,90/mês ou R$ 699/ano (catálogo personalizado, relatórios e exportações avançadas, compras, fornecedores, orçamentos, rótulos, kits). Nunca chamar o tier pago de "Premium".

Constraints da web: Next.js App Router, `next/image`, CSS Modules, sem biblioteca de animação até hoje; rotas, âncoras (`#como-funciona`, `#planos`, `#duvidas`), slugs de guias e `data-analytics` existentes devem ser preservados; calculadora pública em `/landing/calculadora` usa as funções puras do contracts e não envia dados. App em português brasileiro; código em inglês. Acessibilidade: fontes mínimas 16px, alvos 48px, contraste AA, ícone sempre com texto, linguagem sem jargão.

Undecided: lançamento web/iOS; multiusuário.

## Brand Commitments

- Nome "Lucro Caseiro" e logo (`apps/web/public/landing/logo.png`: L vinho com pingo lima sobre quadrado creme) são fixos.
- A landing pública segue a identidade do app, sem mundo visual próprio. Fonte: `docs/designs/design-system/DESIGN.md` ("Profissional Quente"), ADR-0008 e as artes da Play Store em `apps/web/public/landing/poster-*.png`. Tokens: canvas creme #FAF8F6, superfície #F5F3F1, branco #FFFFFF, tinta #24181E, vinho #4A2332 (marca e títulos), rose #B65F72 (uma ação primária por viewport, links, selecao), rose suave #F5E5E8, lima #DCE86A (pingo do logo, olho de seção, um acento por tela), verde menta #6BBF96 (lucro/sucesso), dourado #D4A054 só em badge de plano. Tipografia única: Manrope 400/600/700/800 (800 só em números de dinheiro). Flat: fundo opaco, borda hairline #E9E5E2, raios largos, sem gradiente, sem glass, sem sombra pesada. Corrigido pela dona do produto em 2026-09-02 (rejeitou direções fora da marca).
- Voz: direta, concreta, em português simples; sem jargão de administração, sem hype ("revolucione", "eleve"). Fala com a pessoa como uma colega que entende de preço.
- Proibido inventar depoimentos, números de uso, percentuais de lucro ou comparações com concorrentes (`docs/marketing/provas-e-alegacoes.md`).

## Evidence on Hand

- Telas reais do app e artes da Play Store: `apps/web/public/landing/` (`poster-precificacao.png`, `poster-financeiro.png`, `app-inicio.png`, `app-catalogo.png`, `app-financeiro.png`, `app-precificacao.png`, `app-produtos.png`).
- Preços e limites confirmados em `docs/planos-comerciais.md`.
- Exemplo ilustrativo aprovado para ensino: brigadeiro gourmet, insumos R$ 10, embalagem R$ 2, tempo R$ 8,10, fixos R$ 3, preço sugerido R$ 30,60, sobra R$ 7,50 (rotular sempre como exemplo).
- Ausente hoje, não fabricar: depoimentos, avaliações citáveis, números de downloads ou negócios ativos, catálogo real de cliente com autorização. Confirmado em 2026-09-02.

## Product Principles

1. Simplicidade radical: qualquer ação principal em até 3 toques; a landing deve ser entendida por quem nunca usou app de gestão.
2. Mostrar a conta, não prometer resultado: a demonstração é a precificação real, com exemplo rotulado, nunca um número inventado.
3. Um fluxo, sem recadastro: precificação → produto → catálogo ou venda é a história da marca em toda peça.
4. Linguagem da pessoa, não do sistema: custo, preço, lucro, embalagem, seu tempo; nunca "gestão de ativos" ou "KPI".
5. O grátis é real: dá para fazer o fluxo completo sem pagar; a assinatura entra quando o limite aparece.

## Accessibility & Inclusion

Público inclui idosos e pessoas sem experiência com tecnologia. Texto mínimo 16px, alvos de toque de 48px, contraste WCAG AA, foco visível, ícone sempre acompanhado de texto, movimento respeitando `prefers-reduced-motion`.
