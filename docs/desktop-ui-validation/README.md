# Validação da padronização desktop — 08/09/2026

## Resultado e escopo

Navegação, largura do conteúdo, cabeçalhos, ações, orientações e colunas de formulários usam um padrão compartilhado. Nova venda dimensiona suas grades pela coluna disponível. Catálogo mantém texto e ilustração separados em 1024 px; Fornecedores ocupa o mesmo eixo das demais páginas. As artes dos resumos continuam presentes com totais zero; estados vazios não ganharam PNGs.

Referência de implementação: `apps/mobile/src/shared/layout/desktop-screen-checklist.md`.

## Cobertura visual

- 29 rotas: Início, Produtos, Serviços, Vendas, Nova venda, Agenda, Clientes, Precificação, Precificação completa, Financeiro, Gastos fixos, Materiais, Fichas técnicas, Embalagens, Fornecedores, Compras, Fiado, Orçamentos, Catálogo, Etiquetas, Resultados, Suporte, Mais opções, Comprar insumos, Configurações, Planos, Conheça também, Operações e Operação da Papelaria.
- Auditoria inicial: 24 rotas em 390, 1024 e 1440 px; cinco rotas adicionais em 1024 e 1440 px.
- Confirmação: 29 rotas em 1440 px, sete rotas com ajustes sensíveis em 1024 px e quatro regressões em 390 px.
- Oito formulários em 1024 e 1440 px: produto, serviço, fornecedor, embalagem, material, compra, cliente e etiqueta.
- Nova venda com quatro produtos simulados: seleção de itens, Pix e revisão, em 1024 e 1840 px. O teste chega à revisão e não registra uma venda real.
- Rodapés de produto, compra e etiqueta reconferidos em desktop e mobile.

Os testes de navegador usam Chromium isolado, sessão fictícia e respostas de API interceptadas. Não modificam a conta da usuária. As capturas finais aguardam a montagem da tela, as fontes e o término da transição; capturas intermediárias feitas durante a transição não são a referência final.

## Evidências

- `confirmation.json`: capturas finais, geometria dos cabeçalhos e ausência de rolagem horizontal da página.
- `footer-checks.json`: confirmação dos rodapés.
- `checks.json` e `additional-checks.json`: levantamento inicial.
- `new-sale-items-1024.png`, `new-sale-payment-1024.png` e `new-sale-review-1024.png`: fluxo com dados.
- `catalog-1024.png` e `suppliers-1440.png`: correções de largura e ilustração.

As imagens individuais atualizadas são a referência. Montagens foram usadas durante a inspeção inicial e podem mostrar o estado anterior à última correção.

## Verificações técnicas

- TypeScript sem erros.
- ESLint sem erros.
- Suíte mobile: 100 arquivos, 642 testes aprovados; testes relacionados aos modais executados novamente após o ajuste do rodapé.
- Build PWA de Lucro Caseiro aprovado.
- `git diff --check` sem erros de whitespace.

A cobertura é do app web local. Não inclui homologação nativa em Android/iOS, publicação em produção, painel administrativo restrito nem todas as combinações de dados e permissões.
