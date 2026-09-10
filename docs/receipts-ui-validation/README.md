# Validação dos recibos — 10/09/2026

Prévias geradas a partir de `buildReceiptHtml`, com dados de demonstração.

- Chromium: 320, 393, 493 e 1280 px; nenhum conteúdo ultrapassou a largura disponível nos três cenários (ver `checks.json`).
- `simple`: uma marmita, Pix, pagamento recebido, sem cliente.
- `detailed`: nomes longos, três itens, quantidade por peso, desconto e pagamento pendente.
- `long`: 35 itens e nomes extensos sem espaços para exercitar quebra de linhas e paginação.
- PDFs A5: os exemplos simples e detalhado ocupam uma página; o exemplo longo ocupa seis páginas. Total e situação de pagamento permanecem juntos.
- Inspeção visual de celular, desktop e impressão. Exportação nativa em iOS/Android não executada nesta validação.

Os arquivos HTML e PDF permitem revisar o conteúdo; os PNGs registram a aparência no navegador e na impressão.
