# PRD — Lucro na Obra

Status: aprovado para implementação
Data: 2026-08-13
Produto: vertical da família Lucro para construção, reforma e instalações

## Visão

O Lucro na Obra atende pedreiros, pintores, eletricistas, encanadores, instaladores, mestres de
obra e pequenos empreiteiros. O fluxo canônico é
`visitar → orçar → contratar → planejar → executar → medir → cobrar → entregar → garantir`.

## Módulos completos

1. **Oportunidades e visitas**: cliente, local, necessidade, fotos, medidas preliminares e retorno.
2. **Orçamentos**: ambientes/etapas, composições, materiais, mão de obra, equipamentos,
   terceirização, impostos, BDI configurado e validade.
3. **Propostas e contrato**: versões, escopo, exclusões, cronograma, parcelas e aceite.
4. **Projetos**: endereço, responsáveis, equipe, documentos, datas e situação.
5. **Etapas e tarefas**: dependências, responsáveis, duração, progresso e marcos.
6. **Compras e materiais**: cotação, pedido, entrega, consumo, sobra, devolução e fornecedor.
7. **Equipe**: diária/hora/empreita, presença, apontamento e custo.
8. **Diário de obra**: clima informado, equipe, atividades, ocorrências, fotos e assinatura.
9. **Medições**: quantidade executada, evidência, aprovação, retenção e faturamento.
10. **Aditivos**: mudança de escopo, impacto em custo/prazo, aprovação e versão contratual.
11. **Financeiro**: previsto/realizado, contas, parcelas, retenções, custo por etapa e lucro.
12. **Entrega e garantia**: checklist, pendências, aceite, manual/documentos e chamados.
13. **Indicadores**: avanço físico/financeiro, desvio de custo/prazo, produtividade e margem.

## Regras críticas

- Orçamento e contrato aprovados são snapshots versionados.
- Aditivo aprovado altera a linha de base; edição silenciosa é proibida.
- Medição não pode superar quantidade contratada mais aditivos aprovados.
- Progresso físico não presume recebimento financeiro.
- Compra, consumo e sobra são movimentos separados e auditáveis.
- Valores monetários e percentuais são validados no servidor.
- O app auxilia gestão; não substitui projeto, ART/RRT, laudo ou responsável habilitado.

## Experiência e identidade

- Home combina cronograma da semana com desvios que exigem decisão.
- Assinatura visual: régua de avanço que alinha etapa, medição e cobrança.
- Paleta: `#1E66B3` planta, `#E7A52B` obra, `#43515C` concreto, `#EAF1F5` papel técnico e
  `#222A30` grafite.
- Vocabulário: obra, etapa, composição, medição, aditivo, diário e entrega.

## Critérios de aceite

1. Orçamento calcula custo, preço e margem por etapa e total.
2. Proposta aprovada gera linha de base versionada do projeto.
3. Cronograma respeita dependências e datas reais.
4. Diário registra evidências sem sobrescrever dias fechados.
5. Medição valida quantidade e gera cobrança sem marcar pagamento.
6. Aditivo altera custo/prazo somente após aprovação.
7. Materiais apresentam comprado, entregue, consumido e sobra.
8. Dashboard evidencia desvios de custo, prazo e recebimento.
9. Entrega mantém pendências e garantia vinculadas.
10. Android/PWA têm paridade e build isolado.

## Dependências externas honestas

Mapas, clima automático, assinatura qualificada, emissão fiscal e normas técnicas dependem de
provedores ou profissionais. Estimativas nunca são apresentadas como projeto técnico certificado.
