# Artes dos painéis de topo — validação local

A implementação final mantém as artes dos painéis de topo com os contadores zerados e deixa os estados vazios apenas com texto e CTA. Os PNGs de estado vazio recuperados na primeira proposta foram removidos novamente.

Foram verificados 17 caminhos de tela em 38 cenários no navegador, usando contratos de API simulados e sem chamadas à produção. Os sete painéis corrigidos foram verificados em 320, 390, 768 e 1440 px: Embalagens, Materiais, Etiquetas, Produtos, Serviços, Vendas e Catálogo. Os painéis existentes de Compras, Gastos fixos, Clientes, Fornecedores, Fiado, Financeiro e Precificação foram conferidos em 390 px. Agenda, Insights e Fichas/Receitas foram conferidos sem PNG de estado vazio.

Todos os PNGs de topo esperados carregaram; nenhum PNG de estado vazio foi renderizado; nenhum cenário apresentou rolagem horizontal externa ou erro de execução. No Catálogo móvel, a geometria confirmou que a arte fica abaixo do texto. Evidências em checks.json e nas capturas PNG. Typecheck, lint mobile, context-lint e git diff --check aprovados. Validação em navegador, sem homologação em aparelho nativo.
