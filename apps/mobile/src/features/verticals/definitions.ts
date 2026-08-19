import type {
  PublishedVerticalDomain,
  VerticalDocument,
  VerticalDocumentKind,
} from "@lucro-caseiro/contracts";

export interface VerticalKindDefinition {
  kind: VerticalDocumentKind;
  label: string;
  singular: string;
  detailLabel: string;
  reference?: "asset" | "service_order" | "project";
  numberOneLabel?: string;
  numberTwoLabel?: string;
}

export interface VerticalDefinition {
  eyebrow: string;
  headline: string;
  supporting: string;
  kinds: readonly VerticalKindDefinition[];
}

export const VERTICAL_DEFINITIONS: Record<PublishedVerticalDomain, VerticalDefinition> = {
  revenda: {
    eyebrow: "COMPRA · LOTE · VENDA",
    headline: "Giro sob controle, da origem à garantia.",
    supporting: "Custo posto, atacado, devoluções e seriais no mesmo fluxo.",
    kinds: [
      {
        kind: "import_purchase",
        label: "Compras",
        singular: "compra",
        detailLabel: "País ou origem",
        numberOneLabel: "Câmbio",
      },
      {
        kind: "inventory_lot",
        label: "Lotes",
        singular: "lote",
        detailLabel: "Origem do lote",
      },
      {
        kind: "wholesale_table",
        label: "Atacado",
        singular: "tabela",
        detailLabel: "Segmento de cliente",
        numberOneLabel: "Quantidade mínima",
        numberTwoLabel: "Desconto (%)",
      },
      {
        kind: "return_case",
        label: "Devoluções",
        singular: "devolução",
        detailLabel: "Motivo",
      },
      {
        kind: "warranty_case",
        label: "Garantias",
        singular: "garantia",
        detailLabel: "Problema relatado",
      },
    ],
  },
  oficina: {
    eyebrow: "ENTRADA · DIAGNÓSTICO · TESTE",
    headline: "Cada equipamento tem uma história rastreável.",
    supporting: "Recepção, aprovação, execução e entrega sem perder contexto.",
    kinds: [
      {
        kind: "service_order",
        label: "Ordens",
        singular: "ordem de serviço",
        detailLabel: "Problema relatado",
        reference: "asset",
      },
      {
        kind: "inspection",
        label: "Inspeções",
        singular: "inspeção",
        detailLabel: "Primeiro item do checklist",
        reference: "asset",
      },
      {
        kind: "quote",
        label: "Orçamentos",
        singular: "orçamento",
        detailLabel: "Observação do orçamento",
        reference: "service_order",
        numberOneLabel: "Validade (dias)",
      },
      {
        kind: "warranty_case",
        label: "Garantias",
        singular: "garantia",
        detailLabel: "Problema relatado",
        reference: "service_order",
      },
      {
        kind: "maintenance_plan",
        label: "Manutenções",
        singular: "plano de manutenção",
        detailLabel: "Observação",
        reference: "asset",
        numberOneLabel: "Intervalo (dias)",
      },
    ],
  },
  obra: {
    eyebrow: "ESCOPO · ETAPA · MEDIÇÃO",
    headline: "O avanço físico conversa com o financeiro.",
    supporting: "Orçamento, diário, aditivos e entrega ligados à obra certa.",
    kinds: [
      {
        kind: "estimate",
        label: "Orçamentos",
        singular: "orçamento",
        detailLabel: "Endereço e escopo",
        numberOneLabel: "BDI (%)",
        numberTwoLabel: "Lucro (%)",
      },
      {
        kind: "project",
        label: "Obras",
        singular: "obra",
        detailLabel: "Endereço da obra",
      },
      {
        kind: "stage",
        label: "Etapas",
        singular: "etapa",
        detailLabel: "Responsável",
        reference: "project",
      },
      {
        kind: "daily_log",
        label: "Diários",
        singular: "diário de obra",
        detailLabel: "Atividade executada",
        reference: "project",
        numberOneLabel: "Pessoas na equipe",
      },
      {
        kind: "measurement",
        label: "Medições",
        singular: "medição",
        detailLabel: "Serviço medido",
        reference: "project",
        numberOneLabel: "Quantidade medida",
        numberTwoLabel: "Quantidade contratada",
      },
      {
        kind: "change_order",
        label: "Aditivos",
        singular: "aditivo",
        detailLabel: "Motivo do aditivo",
        reference: "project",
        numberOneLabel: "Impacto em dias",
      },
      {
        kind: "handover",
        label: "Entrega",
        singular: "termo de entrega",
        detailLabel: "Pendências, uma por linha",
        reference: "project",
      },
    ],
  },
};

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  "revenda:import_purchase:draft": { status: "ordered", label: "Pedido realizado" },
  "revenda:import_purchase:ordered": { status: "in_transit", label: "Em trânsito" },
  "revenda:import_purchase:in_transit": { status: "received", label: "Receber compra" },
  "revenda:return_case:requested": { status: "approved", label: "Aprovar" },
  "revenda:return_case:approved": { status: "completed", label: "Concluir" },
  "revenda:warranty_case:opened": { status: "analysis", label: "Iniciar análise" },
  "revenda:warranty_case:analysis": { status: "approved", label: "Aprovar garantia" },
  "revenda:warranty_case:approved": { status: "completed", label: "Concluir" },
  "oficina:service_order:received": { status: "diagnosis", label: "Iniciar diagnóstico" },
  "oficina:service_order:diagnosis": {
    status: "waiting_approval",
    label: "Pedir aprovação",
  },
  "oficina:service_order:waiting_approval": {
    status: "approved",
    label: "Registrar aprovação",
  },
  "oficina:service_order:approved": { status: "in_progress", label: "Iniciar serviço" },
  "oficina:service_order:in_progress": { status: "testing", label: "Enviar para teste" },
  "oficina:service_order:testing": { status: "ready", label: "Marcar como pronto" },
  "oficina:service_order:ready": { status: "delivered", label: "Entregar" },
  "oficina:inspection:draft": { status: "accepted", label: "Aceitar entrada" },
  "oficina:quote:draft": { status: "sent", label: "Enviar orçamento" },
  "oficina:quote:sent": { status: "approved", label: "Registrar aprovação" },
  "oficina:warranty_case:opened": { status: "analysis", label: "Iniciar análise" },
  "oficina:warranty_case:analysis": { status: "covered", label: "Confirmar cobertura" },
  "oficina:warranty_case:covered": { status: "completed", label: "Concluir" },
  "obra:estimate:draft": { status: "sent", label: "Enviar orçamento" },
  "obra:estimate:sent": { status: "approved", label: "Registrar aprovação" },
  "obra:project:planned": { status: "in_progress", label: "Iniciar obra" },
  "obra:project:in_progress": { status: "completed", label: "Concluir obra" },
  "obra:stage:planned": { status: "in_progress", label: "Iniciar etapa" },
  "obra:stage:in_progress": { status: "completed", label: "Concluir etapa" },
  "obra:stage:blocked": { status: "in_progress", label: "Retomar etapa" },
  "obra:daily_log:open": { status: "closed", label: "Fechar diário" },
  "obra:measurement:draft": { status: "sent", label: "Enviar medição" },
  "obra:measurement:sent": { status: "approved", label: "Aprovar medição" },
  "obra:change_order:draft": { status: "sent", label: "Enviar aditivo" },
  "obra:change_order:sent": { status: "approved", label: "Aprovar aditivo" },
  "obra:handover:pending": { status: "accepted", label: "Aceitar entrega" },
  "obra:handover:with_pending_items": { status: "accepted", label: "Aceitar entrega" },
};

export function nextVerticalStatus(document: VerticalDocument) {
  return NEXT_STATUS[`${document.domain}:${document.kind}:${document.status}`];
}

export function referenceKindFor(kind: VerticalDocumentKind) {
  const allKinds = Object.values(VERTICAL_DEFINITIONS).flatMap(
    (definition) => definition.kinds,
  );
  const reference = allKinds.find((item) => item.kind === kind)?.reference;
  if (reference === "service_order") return "service_order" as const;
  if (reference === "project") return "project" as const;
  return undefined;
}

export function statusLabel(status: string) {
  return (
    (
      {
        draft: "Rascunho",
        ordered: "Pedido",
        in_transit: "Em trânsito",
        received: "Recebido",
        active: "Ativo",
        requested: "Solicitado",
        opened: "Aberto",
        analysis: "Em análise",
        approved: "Aprovado",
        completed: "Concluído",
        diagnosis: "Diagnóstico",
        waiting_approval: "Aguardando aprovação",
        in_progress: "Em execução",
        testing: "Em teste",
        ready: "Pronto",
        delivered: "Entregue",
        sent: "Enviado",
        planned: "Planejado",
        open: "Aberto",
        closed: "Fechado",
        pending: "Pendente",
        covered: "Coberto",
      } as Record<string, string>
    )[status] ?? status.replaceAll("_", " ")
  );
}
