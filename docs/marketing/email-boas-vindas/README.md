# Email de boas-vindas — Lucro Caseiro

Modelos criados em 09/09/2026. A segunda opção foi aprovada, enviada ao Gamaliel com autorização e incorporada à automação, agora ativa em produção para novos cadastros confirmados. Nenhum email foi enviado durante os testes. Veja [AUTOMATION.md](./AUTOMATION.md) para o registro de envio, implantação e pendência de publicação do código no GitHub.

- **Assunto:** Boas-vindas, Gamaliel! Vamos cuidar do seu preço?
- **Prévia:** Um próximo passo para a Oliveira Cachaças & Licores: organizar os custos e definir seu preço de venda.
- **Remetente:** `Lucro Caseiro <notificacoes@lucrocaseiro.com.br>` — padrão confirmado em `apps/api/src/config.ts` e nos registros da integração Resend.
- **Assinatura:** Lucro Caseiro.
- **Reply-To:** `contato@orionseven.com.br`, relido na configuração de produção em 09/09/2026 e utilizado no envio autorizado.
- **CTA:** `lucrocaseiro://`, conforme o padrão dos emails existentes; orienta abrir o app manualmente se o cliente de email não abrir o link.

## Arquivos

- `email.html`: corpo HTML para usar no campo `html` do adaptador Resend existente.
- `email.txt`: alternativa de texto para o campo `text`.
- `email-2.html` e `email-2.txt`: segunda opção, com cabeçalho centralizado e orientação em três passos. Assunto: **Gamaliel, seu negócio é bem-vindo aqui.** Prévia: **Uma garrafa de cada vez: organize os custos, calcule o preço e acompanhe suas vendas com o Lucro Caseiro.**
- `preview.html`: comparação interativa dos dois modelos, apenas para revisão no navegador; não deve ser enviada como corpo do email.

Antes de qualquer envio autorizado, usar o assunto acima, o destinatário validado, o Reply-To efetivo e uma chave de idempotência exclusiva para este envio. Não usar os comandos de teste/campanha existentes sem conferir qual template eles enviam.

## Direção visual

Uma carta de boas-vindas com um pequeno quadro de custos como elemento central. A soma de ingredientes, embalagem e despesas torna a orientação concreta para o negócio de bebidas; não há valores inventados nem reprodução do histórico de navegação do destinatário.

Paleta: branco `#FFFFFF`, fundo `#FAF8F6`, texto `#2C2A29`, secundário `#6B6660`, rose `#B65F72` e rose forte `#A85A67`. Cabeçalhos e marca usam Manrope quando disponível, com Segoe UI/Arial como fallback; corpo usa Arial/Helvetica. Não depende de fontes externas.

Layout de uma coluna, largura máxima de 600 px, estilos essenciais inline, tabelas de apresentação, ajuste móvel e botão alternativo VML para Outlook clássico. O conteúdo permanece compreensível com as imagens bloqueadas. O logo usa o asset HTTPS já existente em `/landing/logo.png`.

Estrutura: marca → saudação → orientação de custos → abrir app → pergunta para resposta → assinatura.

Revisão de 09/09/2026: removida a linha rose lateral do quadro do primeiro modelo a pedido da usuária. O segundo modelo também não usa linhas laterais; apresenta uma abertura centralizada em rose suave, três passos sequenciais e uma área de resposta no rodapé. Ambos assinam somente **Lucro Caseiro**.

Para reutilizar, adaptar nome, negócio e exemplos de custo no HTML, texto e assunto. A pergunta sobre produção ou revenda evita presumir o modelo de negócio.

## Validação

A prévia foi inspecionada em navegador em 09/09/2026, no desktop e com viewport móvel de 390 px. O logo HTTPS carregou, o conteúdo ficou sem rolagem horizontal e o botão móvel apresentou 56 px de altura. HTML de aproximadamente 9 KB, sem scripts ou formulários, com texto alternativo separado. Cabeçalho, orientação, botão e assinatura foram conferidos visualmente.

A prévia no navegador verifica composição e responsividade; não equivale a testes reais em Gmail ou Outlook. Abertura do deep link e entrega dependem do dispositivo, do cliente de email e de um envio autorizado posterior.
