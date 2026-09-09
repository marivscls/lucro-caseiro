# Escala tipográfica — validação de 08/09/2026

Ajuste solicitado pela dona do produto para reduzir o tamanho e padronizar os textos das telas.

## Padrão aplicado

| Papel                   | Tamanho / entrelinha |
| ----------------------- | -------------------- |
| Título de tela, celular | 18 / 24 px           |
| Título de tela, desktop | 20 / 26 px           |
| Seção e estado vazio    | 16 / 22 px           |
| Corpo e ações           | 14 / 20 px           |
| Subtítulo e legenda     | 13 / 18 px           |
| Preço em lista          | 16 / 22 px           |
| Resumo financeiro       | 20 / 26 px           |
| Total principal         | 24 / 30 px           |

Manrope continua como família única. A escala fica em `packages/ui/src/theme.ts` e `packages/ui/src/components/typography.tsx`; ações grandes também usam texto de 14 px. Os alvos de toque mantêm suas alturas e os campos de digitação mantêm 16 px. Preferências de fonte e zoom não foram desativadas.

Os tamanhos isolados dos resumos de Etiquetas, Embalagens, Materiais e Fornecedores foram substituídos por variantes compartilhadas. As orientações usam o corpo padrão; títulos do desktop, cadastros e personalização foram ajustados. Arte, dados e fluxos permanecem existentes. Prévia de impressão de etiqueta e lettering de marca em ilustrações conservam seu papel próprio.

## Verificação

- 29 rotas do app em celular e desktop; verificações adicionais em 320 px para Etiquetas, Embalagens, Materiais e Nova venda.
- Chromium isolado com sessão e dados simulados; nenhuma escrita na conta real.
- Capturas aguardam conteúdo, fontes e transição antes da inspeção.
- `checks.json` contém a rodada de confirmação e o levantamento de tamanhos calculados; as primeiras capturas de celular também permanecem como evidência.
- A inspeção inicial identificou o resumo de Fornecedores em 34 px e o campo de Precificação completa em 26 px. Ambos foram normalizados e reconferidos.
- TypeScript do app e do pacote UI, ESLint, 642 testes e build web aprovados.
- O detector de tipografia não apontou achados; a leitura de código e o navegador identificaram exceções que o detector não cobria.

Referência normativa: `docs/adr/0008-tipografia-manrope.md`. Esta cobertura é web; não representa homologação nativa em Android/iOS nem todas as combinações de dados.

No perfil de artesanato simulado, as rotas Operações e Operação da Papelaria redirecionam para Início. A navegação dessas duas rotas foi conferida, mas os interiores dos módulos específicos não foram homologados neste perfil.
