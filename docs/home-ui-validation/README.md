# Início — implementação e validação de 10/09/2026

Todas as prioridades aprovadas foram implementadas em `apps/mobile`.

## Comportamento

- **Seu dia:** até três compromissos em aberto, ordenados por prazo. Pendências antigas não escondem o próximo compromisso. Cada linha abre o detalhe correspondente na agenda.
- **Ações rápidas:** quatro ações por perfil. Serviços oferece Agendar atendimento e Serviços; produção/revenda oferece Nova venda e Produtos. Calcular preço e Anotar despesa completam os atalhos. A despesa abre o formulário com o tipo correto. Serviços usa duas colunas em celulares.
- **Dinheiro:** vendido, entradas recebidas e despesas aparecem com o período explícito. O saldo informa que corresponde apenas a entradas menos despesas registradas. Recebimentos pendentes de todos os períodos ficam separados; a soma percorre todas as páginas e desconta pagamentos parciais. Compromissos da agenda ainda não vinculados a vendas aparecem separadamente, descontando sinais.
- **Precisa de atenção:** no máximo três alertas verificáveis de reposição ou preço abaixo do custo cadastrado. Sem dados que justifiquem um alerta, nenhum alerta é inventado. A linha abre o produto correspondente.
- **Meta do mês:** aparece depois da rotina e dos alertas, com progresso, valor restante e explicação da retirada desejada. O cálculo existente no servidor usa entradas financeiras; por isso a interface não promete que vendas ainda não recebidas avancem a meta.
- **Estados de dados:** carregamento, erro, cache desatualizado e zero confirmado são distintos. Uma falha da meta não sugere cadastrar outra. Falha intermediária na paginação não apresenta recebimentos parciais como total.
- **Orientação e nomenclatura:** as ações que criam venda se chamam Nova venda. A orientação superior fica compacta após atividade; editar o perfil continua disponível nas configurações.
- **Ampliação de texto:** removidos os limites de 10% dos componentes substituídos. Valores e ações podem crescer e quebrar linha. A navegação inferior permite quebra dos rótulos e reserva espaço adicional conforme a escala de fonte do aparelho.

## Verificações

36 testes direcionados, cobrindo domínio, paginação, estados financeiros e da meta, orientação e navegação. Exportação web do Expo e lint dos arquivos alterados.

Sete cenários de navegador, todos com dados fictícios e requisições externas interceptadas:

1. Celular de 390 px, incluindo detalhe da agenda, criação de despesa e detalhe do produto.
2. Celular de 320 px.
3. Celular de 320 px com simulação de texto a 150%.
4. Desktop de 1440 px.
5. Perfil de serviços e abertura de Novo atendimento.
6. Conta sem vendas, compromissos ou produtos.
7. Falha ao carregar financeiro e meta.

O resultado automatizado está em `checks.json`. As imagens de cada cenário mostram o topo e uma posição inferior da rolagem; a página possui rolagem interna, portanto não são capturas contínuas de todo o conteúdo.

O comando padrão de TypeScript encontrou a resolução ausente de `node:fs` e `node:vm` no teste preexistente `push-service-worker.test.ts`. A verificação foi executada também com os tipos Node instalados explicitamente indicados, sem alterar esse teste ou as dependências.

Não houve publicação. A simulação web de texto ampliado não substitui uma verificação em aparelho Android/iOS com as configurações de acessibilidade do sistema.

## Reproduzir

Na raiz do projeto:

```powershell
pnpm --filter @lucro-caseiro/mobile test -- src/features/home src/features/onboarding/profile-data.test.ts src/shared/utils/home-next-step.test.ts src/shared/layout/floating-tab-bar.test.ts src/shared/layout/mobile-tab-bar.test.ts
pnpm --filter @lucro-caseiro/mobile exec expo export --platform web --output-dir dist-home-review
$env:PLAYWRIGHT_PATH = 'C:/Users/maria/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
node apps/mobile/scripts/home-validation.cjs
```

O script inicia e encerra seu servidor local na porta 8094. Requer o `.env` local para identificar o host de autenticação a interceptar; não usa uma sessão real. Em outro ambiente, `PLAYWRIGHT_PATH` pode apontar para outra instalação do Playwright ou ser omitido quando o pacote estiver disponível normalmente.
