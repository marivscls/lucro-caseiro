---
target: Tela Início do Lucro Caseiro enviada pela usuária
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\maria\\Documents\\projects\\lucro-caseiro\\apps\\mobile\\src\\app\\tabs\\index.tsx"
target_fingerprint: "sha256:70fccf1909bcd7b0f047afef42995fdff8c343399b6e23e603851fa2c08b2db8"
target_path: "C:\\Users\\maria\\Documents\\projects\\lucro-caseiro\\apps\\mobile\\src\\app\\tabs\\index.tsx"
timestamp: 2026-09-10T12-16-53Z
slug: apps-mobile-src-app-tabs-index-tsx
---

Método: duas avaliações independentes (A: /root/design_assessment · B: /root/evidence_assessment).

# Lucro Caseiro — avaliação inicial da tela Início

Data: 10/09/2026. Base: captura fornecida e código de apps/mobile/src/app/tabs/index.tsx. Notas provisórias de revisão especializada; navegação, rede, leitor de tela e uso em aparelho real não foram testados. Não há dados de conversão ou entrevistas nesta sessão.

## Negócio e experiência

O produto já tem uma proposta clara: ajudar a cobrar com mais segurança e organizar o negócio pelo celular, reaproveitando informações. O app contempla produção, revenda e serviços e respeita a prioridade escolhida no perfil. A análise não recomenda forçar todas as pessoas a passar por precificação.

Há duas definições documentadas a conciliar na medição: o funil de preço → produto → catálogo/venda e primeiro valor por objetivo (incluindo agenda e financeiro). Medir ambos separadamente evita interpretar uso útil de serviços como falha de ativação.

## Avaliação heurística

Notas de 0 a 4, baseadas na captura e no código, sem validação com usuárias.

| Heurística           | Nota      | Principal evidência ou limite                               |
| -------------------- | --------- | ----------------------------------------------------------- |
| Estado do sistema    | 2         | Dados financeiros ausentes podem aparecer como zero         |
| Linguagem familiar   | 3         | Texto acessível; significado da meta incompleto             |
| Controle e liberdade | 3         | Saídas previstas no código; não exercitadas                 |
| Consistência         | 2         | Quatro rótulos para abrir criação de venda                  |
| Prevenção de erros   | 2         | Zero e indisponibilidade não ficam separados                |
| Reconhecimento       | 3         | Atalhos e navegação rotulados                               |
| Eficiência           | 2         | Atalho inferior útil; ações repetidas ocupam espaço         |
| Minimalismo          | 2         | Boa composição, com excesso de destaque para a mesma tarefa |
| Recuperação de erros | 2         | Repetir consulta existe, mas resumo pode mostrar zeros      |
| Ajuda                | 3         | Ajuda contextual implementada; compreensão não testada      |
| **Total provisório** | **24/40** | Faixa aceitável da rubrica; não é medida de satisfação      |

## O que funciona

Identidade vinho, creme e lima consistente com a marca. Ícones acompanhados de texto e agrupamento visual facilitam localizar funções. A recomendação considera o objetivo declarado e a seleção Hoje/Mês tem semântica de rádio no código.

A composição é reconhecível como Lucro Caseiro; a oportunidade maior é tornar o próximo trabalho e o significado dos números mais claros, preservando a identidade.

## Prioridades

1. **P1 — Mostrar indisponibilidade sem inventar zero.** Em index.tsx:1063, o carregamento do resumo depende da ausência de vendas; em :1068–1069, financeiro ainda ausente vira zero. O erro é exibido separadamente. A meta também não diferencia erro de ausência de configuração (:1079–1088). Separar carregando, indisponível e zero confirmado. Risco confirmado pela leitura do código; cenário de rede não reproduzido.

2. **P2 — Unificar o nome da criação de venda e reduzir repetição.** “Organizar uma venda”, “Registrar venda”, “Venda” e “Nova venda” conduzem à criação de venda. Evidências: features/onboarding/profile-data.ts:245–246, index.tsx:626 e :1070, rota tabs/new-sale. A pessoa pode supor funções diferentes. Manter acesso inferior e testar orientação superior mais compacta após primeiro resultado, sem retirar a prioridade escolhida.

3. **P2 — Explicar o que os números medem.** Vendas e entradas não são necessariamente o mesmo evento. A meta usa currentRevenue/requiredRevenue (index.tsx:1084–1085) e é mensal, mesmo com Hoje selecionado no resumo. Explicitar “Meta de vendas do mês” e relação com retirada desejada; explicar recebimentos. Não há erro de cálculo comprovado. Não apresentar entradas menos despesas como lucro líquido do negócio.

4. **P2 — Respeitar a ampliação de fonte.** maxFontSizeMultiplier={1.1} limita ampliação de valores, ações e atalhos (index.tsx:384,470,481,597,680). Testar texto ampliado com quebra/reorganização do layout. Preservar a escala menor solicitada pela dona do produto em 08/09; tamanho base menor que 16 px, isoladamente, não prova falha de acessibilidade.

## Carga cognitiva e situações de uso

Carga estimada moderada: boa separação por blocos, porém repetição de ações e interpretação de conceitos monetários exigem decisões desnecessárias. Cinco itens de navegação não bastam para concluir sobrecarga.

- Iniciante: pode confundir organizar e registrar venda ou interpretar meta como lucro.
- Pessoa com baixa visão: ampliação limitada merece teste em aparelho, sem concluir falha de leitor de tela pela captura.
- Pessoa atendendo pelo celular: atalho inferior favorece rapidez; testar se o bloco do perfil continua útil no retorno diário.

O acolhimento inicial é um ponto forte. “2% da meta” sem contexto pode gerar dúvida; reação emocional é hipótese, não observação de uma usuária. O destaque fixo de “Venda” no acesso rápido também pode parecer seleção.

## Próxima etapa proposta

Validar a prioridade empresarial e testar compreensão da venda, dos recebimentos e da meta com pessoas do público. Primeiro resultado por objetivo e retorno com ação útil são indicadores mais relevantes que cliques isolados. Corrigir estados financeiros precede mudanças amplas de layout.

Questão em aberto: qual resultado importa mais agora — primeiro valor, retorno útil ou conversão paga?
