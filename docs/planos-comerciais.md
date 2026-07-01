# Planos comerciais do Lucro Caseiro

Status: proposta aprovada para documentacao  
Data: 2026-06-30

Este documento registra o modelo de planos desejado para o Lucro Caseiro, inspirado na logica de planos do Kyte, mas simplificado para apenas dois planos pagos.

## Principio

O Lucro Caseiro deve vender simplicidade primeiro e profissionalizacao depois.

- O plano gratis serve para testar e comecar.
- O plano Essencial remove os limites que atrapalham o uso diario.
- O plano Profissional libera recursos de apresentacao, controle avancado, exportacao e crescimento.

A pessoa nunca deve perder acesso aos dados antigos ao bater limite. Ela pode continuar consultando o que ja cadastrou; o bloqueio deve acontecer apenas para novos cadastros ou recursos premium.

## Planos

| Plano        | Preco mensal | Papel                                                  |
| ------------ | -----------: | ------------------------------------------------------ |
| Gratis       |         R$ 0 | Degustacao com limites claros.                         |
| Essencial    |     R$ 29,90 | Uso real para quem trabalha sozinha ou esta comecando. |
| Profissional |     R$ 69,90 | Operacao mais completa para negocio em crescimento.    |

## Plano Gratis

Objetivo: permitir que a usuaria teste o app com fluxo real, mas encontre o limite quando comecar a usar todos os dias.

| Recurso                |                      Limite |
| ---------------------- | --------------------------: |
| Usuarios               |                           1 |
| Vendas                 |                  30 por mes |
| Clientes               |                          20 |
| Produtos               |                          15 |
| Fotos por produto      |                           1 |
| Receitas               |                           5 |
| Embalagens             |                           3 |
| Fornecedores           |                           3 |
| Catalogo online        |                      Basico |
| Agenda/encomendas      |                      Basico |
| Fiado/clientes devendo |                      Basico |
| Financeiro             |              Resumo simples |
| Recibos                | Simples, sem personalizacao |
| Exportar PDF/XLSX      |                         Nao |
| Relatorios avancados   |                         Nao |
| Catalogo personalizado |                         Nao |
| Rotulos premium        |                         Nao |
| Suporte                |                      Basico |

## Plano Essencial

Preco: R$ 29,90 por mes

Objetivo: ser o plano principal para autonomas e pequenos negocios que precisam sair do caderno, planilha e WhatsApp solto.

Deve incluir:

- Vendas ilimitadas.
- Clientes ilimitados.
- Produtos ilimitados.
- Agenda e encomendas.
- Fiado e controle de clientes devendo.
- Financeiro basico.
- Receitas.
- Precificacao.
- Estoque basico.
- Catalogo online basico.
- Recibo simples.
- 1 usuario.
- 1 foto por produto.

Regra comercial: depois que a pessoa paga o Essencial, ela nao deve bater em limite de volume basico como venda, cliente ou produto.

## Plano Profissional

Preco: R$ 69,90 por mes

Objetivo: ser o plano completo para quem quer operar com mais controle, melhor apresentacao e mais produtividade.

Deve incluir tudo do Essencial, mais:

- Catalogo premium.
- Varias fotos por produto.
- Relatorios avancados.
- Exportacao em PDF/XLSX.
- Fornecedores.
- Compras.
- Despesas recorrentes.
- Estoque completo.
- Orcamentos em PDF.
- Rotulos premium.
- Embalagens.
- Produtos compostos/kits.
- Personalizacao visual.
- Suporte prioritario.
- Multiusuario, quando existir.
- Web/desktop, quando existir.

Regra comercial: o Profissional deve vender profissionalizacao, economia de tempo e melhor apresentacao do negocio.

## Anual

Usar a logica de 2 meses gratis:

| Plano        |   Mensal | Anual sugerido |
| ------------ | -------: | -------------: |
| Essencial    | R$ 29,90 |      R$ 299,00 |
| Profissional | R$ 69,90 |      R$ 699,00 |

## Comparacao resumida

| Recurso                 | Gratis         | Essencial               | Profissional                |
| ----------------------- | -------------- | ----------------------- | --------------------------- |
| Vendas                  | 30/mes         | Ilimitadas              | Ilimitadas                  |
| Clientes                | 20             | Ilimitados              | Ilimitados                  |
| Produtos                | 15             | Ilimitados              | Ilimitados                  |
| Receitas                | 5              | Ilimitadas              | Ilimitadas                  |
| Embalagens              | 3              | Ilimitadas              | Ilimitadas                  |
| Fornecedores            | 3              | Limitado ou nao incluso | Ilimitados                  |
| Fotos por produto       | 1              | 1                       | Varias                      |
| Catalogo online         | Basico         | Basico                  | Premium                     |
| Agenda/encomendas       | Basico         | Completo                | Completo                    |
| Fiado                   | Basico         | Completo                | Completo                    |
| Financeiro              | Resumo simples | Basico                  | Completo                    |
| Relatorios avancados    | Nao            | Nao                     | Sim                         |
| Exportacao PDF/XLSX     | Nao            | Nao                     | Sim                         |
| Recibos                 | Simples        | Simples                 | Personalizados              |
| Orcamentos em PDF       | Nao            | Nao                     | Sim                         |
| Rotulos premium         | Nao            | Nao                     | Sim                         |
| Produtos compostos/kits | Nao            | Nao                     | Sim                         |
| Despesas recorrentes    | Nao            | Nao                     | Sim                         |
| Usuarios                | 1              | 1                       | Multiusuario quando existir |
| Suporte                 | Basico         | Basico                  | Prioritario                 |

## Diferenca para o Kyte

O Kyte trabalha com mais niveis de plano. O Lucro Caseiro deve manter a oferta mais simples:

- Kyte PRO e parte do GROW viram o Essencial.
- Kyte GROW/PRIME viram o Profissional.
- O Lucro Caseiro nao precisa de um terceiro plano de R$ 99,90 agora.

O plano de R$ 69,90 deve ser percebido como completo, deixando fora apenas servicos caros de manter, como implantacao assistida ou suporte humano muito intensivo.

## Impacto de implementacao

Hoje o app ainda tem partes modeladas como `free` e `premium`, com Premium antigo. Para aplicar este modelo, sera necessario:

1. Trocar o modelo de plano para `free`, `essential` e `professional`.
2. Atualizar Stripe/Google Play com os novos produtos mensais e anuais.
3. Atualizar a tela de planos e paywalls.
4. Atualizar limites do backend, especialmente vendas gratis de 50 para 30 por mes.
5. Separar gates de recurso entre Essencial e Profissional.
6. Garantir que dados antigos continuam visiveis quando a usuaria faz downgrade ou bate limite.
7. Criar testes para limites e permissoes por plano.

## Mensagem de posicionamento

Essencial: para organizar vendas, clientes e produtos sem limite.

Profissional: para controlar melhor, vender com apresentacao mais bonita e ganhar tempo com recursos avancados.
