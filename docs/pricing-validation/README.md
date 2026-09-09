# Validação da precificação — 09/09/2026

Implementação local: tela única com custos expansíveis, fórmula corrigida, origens cadastradas, preço alternativo/aplicação confirmada e alertas por aumento dos custos.

## Verificações concluídas

- API: 46 testes de precificação aprovados.
- Aplicativo: 25 testes de precificação aprovados, incluindo conservação do rascunho entre layouts e isolamento entre contas.
- Typecheck: mobile, api, contracts e database aprovados.
- ESLint: feature pricing, rota principal e redirecionamento aprovados.
- Validação de contexto: documentos mobile e API aprovados; avisos de documentação ausente em outras features preexistentes.
- Navegador: cadastros fictícios, receita atual e embalagem aumentada, cancelamento sem gravar, aplicação confirmada, falha ao salvar, falha parcial ao aplicar, rateios e limite combinado, plano gratuito, rota antiga e teclado.
- Larguras: 320, 390, 768, 1024 e 1440 pixels, sem overflow horizontal. O preço alternativo permanece durante as mudanças de layout.
- Nenhum erro JavaScript de página na rodada concluída (`browser-results.json`).

`browser-check.cjs` intercepta todas as requisições remotas com fixtures. Nenhuma conta real é alterada. O script usa o Playwright do runtime instalado nesta máquina e o servidor Expo em localhost:8083. Os screenshots `pricing-*.png` mostram a simulação validada.

## Publicação e banco

A interface local usa a API publicada configurada em `apps/mobile/.env`. A API local tem configuração de banco de exemplo. A migration `063_pricing_source_snapshot.sql` foi preparada e registrada no bootstrap, mas não foi aplicada a um banco nesta tarefa. Não houve deploy.

Publicar migração/API antes do aplicativo. A tela nova grava em `/api/v1/pricing/calculate-v2`, evitando que uma API antiga descarte silenciosamente as origens ou use a fórmula anterior. Após publicar, validar persistência real e leitura de `source_snapshot` em uma conta de teste.

Históricos antigos permanecem legíveis, com origem desconhecida. Os alertas confiáveis começam nos cálculos salvos com origem registrada. O histórico guarda a sugestão; o preço comercial confirmado é salvo no produto. Preços próprios das variações não são alterados.
