# Revisão de clientes — better-ui

As três telas usam os componentes e cores existentes. Dados de navegador são
simulados; chamadas externas e gravações são interceptadas pelo script
`apps/mobile/scripts/clients-ui-smoke.cjs`.

| Severidade | Local                                                                   | Antes                                                                      | Depois                                                                     | Princípio / impacto                                                |
| ---------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| MEDIUM     | `apps/mobile/src/features/clients/components/client-form-fields.tsx:32` | Cadastro e edição tinham campos com superfícies e espaçamentos diferentes. | Componente único com rótulos externos, campos de 48 px e instrução curta.  | Consistência das superfícies; leitura e preenchimento mais claros. |
| MEDIUM     | `apps/mobile/src/features/clients/components/client-detail.tsx:130`     | Cabeçalho alto, telefone duplicado e letras como ícones.                   | Identificação horizontal, telefone formatado uma vez e ícones contextuais. | Hierarquia e peso óptico; mais informação útil no celular.         |
| LOW        | `apps/mobile/src/features/clients/components/edit-client-form.tsx:178`  | Dados pessoais e acompanhamento apareciam na mesma sequência longa.        | Próximo contato tem seção expansível que preserva os valores.              | Agrupamento; reduz a extensão inicial do formulário.               |

Verificação: fluxos de perfil, abrir edição, recolher/expandir contato, salvar,
abrir cadastro, validar nome obrigatório e cadastrar; larguras 320, 390, 482 e
1440 px, além de modo escuro em 390 px. Quatro testes de clientes passaram.
ESLint dos quatro arquivos de interface passou.

A checagem geral de TypeScript encontrou erros de `numericMode` em campos de
produtos, fora dos arquivos desta alteração.

Not verified: teclado virtual em aparelho Android/iOS, WhatsApp externo,
hover e reprodução de animações em 10% da velocidade. Nenhuma animação nova
foi introduzida; componentes compartilhados mantêm seus comportamentos.

Approve — para os fluxos e estados verificados acima.
