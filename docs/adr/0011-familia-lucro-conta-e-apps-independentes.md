# ADR-0011 — Família Lucro: conta compartilhada e apps independentes

**Status:** aceito (2026-08-13)

## Contexto

Lucro Caseiro, Papelaria e Manicure já possuem builds isolados da mesma base. A expansão
aprovada publica Revenda, Oficina e Obra como aplicativos próprios porque suas operações não
disputam diretamente o núcleo do Lucro Caseiro. Cozinha, Beleza e Pet permanecem como pesquisa
de extensões futuras e não recebem builds separados nesta decisão.

## Decisão

1. “Lucro” é a família; Papelaria, Revenda, Oficina e Obra possuem app, build, package/bundle,
   scheme, domínio, catálogo, listing e identidade próprios.
2. A autenticação Supabase e o `user.id` formam a **Conta Lucro** compartilhada.
3. Uma nova tabela de memberships registra quais verticais a conta usa, onboarding e situação.
4. Dados comuns continuam canônicos: usuário, negócio, clientes, fornecedores, produtos,
   vendas, financeiro e assinatura.
5. Dados específicos pertencem ao domínio e carregam `user_id + domain` quando compartilharem
   infraestrutura.
6. Cada app inclui “Aplicativos Lucro” com deep links para conhecer/abrir os demais; nenhum
   requer instalação prévia do Lucro Caseiro.
7. Assinatura usa entitlements por vertical. Bundle comercial é permitido, mas não concede nem
   remove plano ativo por inferência.
8. Troca de app ocorre por deep link/build externo, não por mudança de marca em runtime.

## Consequências

- Uma conta pode operar múltiplas verticais sem duplicar cadastro.
- Catálogos e identidades permanecem isolados.
- Dados compartilhados exigem autorização explícita; dados sensíveis de uma vertical não
  aparecem automaticamente em outra.
- Cozinha, Beleza e Pet só podem virar novos apps após validação comercial e nova decisão.

## Rejeitado

- Um superapp com todas as abas visíveis para todos.
- Apps que são somente skins.
- Banco separado por marca, que duplicaria clientes, financeiro e autenticação.
