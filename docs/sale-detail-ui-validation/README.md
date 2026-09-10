# Detalhes da venda — better-ui

Aplicado em `apps/mobile/src/features/sales/components/sale-detail.tsx`.

| Severidade | Local               | Antes                                | Depois                                                                | Princípio e impacto                                 |
| ---------- | ------------------- | ------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------- |
| MEDIUM     | sale-detail.tsx:163 | Status isolado e total após os itens | Total, status e data no topo                                          | Hierarquia: valor principal aparece de imediato     |
| MEDIUM     | sale-detail.tsx:215 | Um cartão alto por item              | Lista em uma superfície, separadores e raios 20/8 com inset 12        | Superfícies concêntricas e densidade: menos rolagem |
| MEDIUM     | sale-detail.tsx:372 | Recibos e ações com peso semelhante  | WhatsApp preenchido, PDF com contorno e edição/cancelamento separados | Hierarquia de ações: próximo passo evidente         |
| LOW        | sale-detail.tsx:215 | Nomes disputavam largura com preços  | Nome em linha própria e valores com quebra flexível                   | Alinhamento e leitura em telas estreitas            |

Verificado: TypeScript mobile; ESLint do componente; Prettier; context-lint mobile (aviso preexistente em verticals). Navegador Chromium com API simulada: 320, 390, 482 e 1440 px; tema escuro; nomes longos, cinco itens, desconto e notas; pendente; cancelada; lista vazia. Sem transbordamento horizontal ou erro JavaScript. Abertura da prévia do recibo no plano gratuito confirmada. Nenhuma gravação externa realizada.

Inspeção visual: capturas de 390 px nos temas claro/escuro e conteúdo longo. O exemplo de uma marmita cabe inteiro em 390 × 844 px, incluindo editar e cancelar.

Not verified: envio real pelo WhatsApp, exportação PDF Premium, persistência de editar/cancelar/pagar, aparelhos Android/iOS, imagem de produto, hover/foco/loading em execução e reprodução da animação em 10% da velocidade. Botões reutilizam escala 0.96, redução de movimento e bloqueio durante loading do componente compartilhado; nenhuma animação nova.

Reprodução: iniciar Expo web na porta 8090 e executar `node apps/mobile/scripts/sale-detail-ui-smoke.cjs` com Playwright disponível. `SALES_SCENARIO`: populated, dark, long, pending, cancelled, empty. `VALIDATION_PREVIEW_URL` permite trocar a URL local.

Approve — apenas o escopo visual e as verificações descritas acima.
