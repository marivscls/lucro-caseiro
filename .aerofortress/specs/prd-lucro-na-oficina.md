# PRD — Lucro na Oficina

Status: aprovado para implementação
Data: 2026-08-13
Produto: vertical da família Lucro para reparo e manutenção

## Visão

O Lucro na Oficina atende oficina automotiva, bicicleta, refrigeração, eletrodomésticos,
informática e assistência de celulares. O fluxo canônico é
`receber bem → inspecionar → diagnosticar → orçar → aprovar → reparar → testar → entregar → garantir`.

## Módulos completos

1. **Clientes e ativos**: veículo/equipamento, placa, chassi, patrimônio, marca, modelo, IMEI,
   serial, acessórios recebidos e histórico.
2. **Check-in**: defeito relatado, checklist, fotos, avarias, senha não armazenada, termo e
   assinatura do cliente.
3. **Ordem de serviço**: prioridade, técnico, prazo, status, diagnóstico, peças, mão de obra e
   notas internas/públicas.
4. **Orçamento e aprovação**: alternativas, validade, PDF/link, aceite/recusa, data e trilha.
5. **Peças e estoque**: reserva, consumo, devolução, encomenda, fornecedor e garantia da peça.
6. **Execução**: tarefas, tempos, apontamento técnico, testes, fotos e controle de qualidade.
7. **Terceiros**: serviço subcontratado, envio, custo, prazo e retorno.
8. **Entrega e recebimento**: checklist final, pagamento parcial, fiado, comprovante e aceite.
9. **Garantia e retorno**: cobertura, prazo, diagnóstico, vínculo com OS e custo de retrabalho.
10. **Manutenção preventiva**: plano, quilometragem/data, lembrete e próxima revisão.
11. **Comunicação**: página de acompanhamento por token e mensagens de mudança de estado.
12. **Indicadores**: tempo de ciclo, aprovação, produtividade, retrabalho, peças, lucro por OS,
    técnico e tipo de serviço.

## Regras críticas

- Ativo e OS pertencem ao mesmo usuário/cliente; referências cruzadas são rejeitadas.
- Fotos de entrada e checklist não podem ser sobrescritos após aceite; correções são aditivas.
- Orçamento aprovado vira snapshot; acréscimos exigem nova aprovação.
- Peça só é consumida na execução/entrega e o movimento é idempotente.
- Entrega não presume quitação.
- Garantia referencia a OS original e separa retrabalho coberto de novo serviço.
- Senhas, PINs e credenciais do aparelho nunca são armazenados em texto livre.

## Experiência e identidade

- Home em quadro de oficina: recebidos, diagnóstico, aguardando aprovação, execução e prontos.
- Assinatura visual: cartão de OS com trilha de inspeção e selo de teste final.
- Paleta: `#F06A23` segurança, `#315A6B` aço, `#182229` grafite, `#E8EEF0` chapa e
  `#F9FAF8` oficina clara.
- Vocabulário: ativo, check-in, diagnóstico, OS, peça, teste e garantia.

## Critérios de aceite

1. Check-in registra ativo, acessórios, checklist, avarias e fotos.
2. Orçamento aprovado fica imutável e acréscimo pede nova aprovação.
3. Mudanças de estado seguem a máquina de estados da OS.
4. Peças reservadas/consumidas atualizam estoque sem duplicidade.
5. Cliente acompanha apenas dados públicos da própria OS por token revogável.
6. Pagamento parcial cria somente o saldo pendente.
7. Garantia mantém vínculo e custo de retrabalho.
8. Histórico preventivo gera próxima revisão sem criar atendimento automático.
9. Indicadores são derivados de eventos e valores reais.
10. Android/PWA têm paridade e build isolado.

## Dependências externas honestas

Assinatura eletrônica qualificada, WhatsApp oficial, consulta veicular e emissão fiscal exigem
provedores. O app registra aceite operacional e estados, sem prometer validade externa inexistente.
