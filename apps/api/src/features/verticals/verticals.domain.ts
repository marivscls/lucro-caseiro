import type {
  PublishedVerticalDomain,
  VerticalDocument,
  VerticalDocumentKind,
  VerticalDocumentItemInput,
} from "@lucro-caseiro/contracts";

const INITIAL_STATUS: Record<
  PublishedVerticalDomain,
  Partial<Record<VerticalDocumentKind, string>>
> = {
  revenda: {
    import_purchase: "draft",
    inventory_lot: "received",
    wholesale_table: "active",
    return_case: "requested",
    warranty_case: "opened",
  },
  oficina: {
    service_order: "received",
    inspection: "draft",
    quote: "draft",
    warranty_case: "opened",
    maintenance_plan: "active",
  },
  obra: {
    estimate: "draft",
    project: "planned",
    stage: "planned",
    daily_log: "open",
    measurement: "draft",
    change_order: "draft",
    handover: "pending",
  },
};

const TRANSITIONS: Record<string, readonly string[]> = {
  "revenda:import_purchase:draft": ["ordered", "cancelled"],
  "revenda:import_purchase:ordered": ["in_transit", "partial", "received", "cancelled"],
  "revenda:import_purchase:in_transit": ["partial", "received", "cancelled"],
  "revenda:import_purchase:partial": ["received", "cancelled"],
  "revenda:return_case:requested": ["approved", "rejected"],
  "revenda:return_case:approved": ["completed", "cancelled"],
  "revenda:warranty_case:opened": ["analysis", "approved", "rejected"],
  "revenda:warranty_case:analysis": ["approved", "rejected"],
  "revenda:warranty_case:approved": ["completed"],
  "oficina:service_order:received": ["diagnosis", "cancelled"],
  "oficina:service_order:diagnosis": ["waiting_approval", "cancelled"],
  "oficina:service_order:waiting_approval": ["approved", "rejected", "cancelled"],
  "oficina:service_order:approved": ["in_progress", "cancelled"],
  "oficina:service_order:in_progress": ["testing", "waiting_parts", "cancelled"],
  "oficina:service_order:waiting_parts": ["in_progress", "cancelled"],
  "oficina:service_order:testing": ["ready", "in_progress"],
  "oficina:service_order:ready": ["delivered"],
  "oficina:inspection:draft": ["accepted", "cancelled"],
  "oficina:quote:draft": ["sent", "cancelled"],
  "oficina:quote:sent": ["approved", "rejected", "expired"],
  "oficina:warranty_case:opened": ["analysis", "covered", "not_covered"],
  "oficina:warranty_case:analysis": ["covered", "not_covered"],
  "oficina:warranty_case:covered": ["completed"],
  "obra:estimate:draft": ["sent", "cancelled"],
  "obra:estimate:sent": ["approved", "rejected", "expired"],
  "obra:project:planned": ["in_progress", "cancelled"],
  "obra:project:in_progress": ["paused", "completed", "cancelled"],
  "obra:project:paused": ["in_progress", "cancelled"],
  "obra:stage:planned": ["in_progress", "cancelled"],
  "obra:stage:in_progress": ["blocked", "completed", "cancelled"],
  "obra:stage:blocked": ["in_progress", "cancelled"],
  "obra:daily_log:open": ["closed"],
  "obra:measurement:draft": ["sent", "cancelled"],
  "obra:measurement:sent": ["approved", "rejected"],
  "obra:change_order:draft": ["sent", "cancelled"],
  "obra:change_order:sent": ["approved", "rejected"],
  "obra:handover:pending": ["accepted", "with_pending_items"],
  "obra:handover:with_pending_items": ["accepted"],
};

export function initialVerticalStatus(
  domain: PublishedVerticalDomain,
  kind: VerticalDocumentKind,
): string {
  const status = INITIAL_STATUS[domain][kind];
  if (!status) throw new Error(`Documento ${kind} não pertence ao domínio ${domain}`);
  return status;
}

export function canTransitionVerticalDocument(
  document: Pick<VerticalDocument, "domain" | "kind" | "status">,
  nextStatus: string,
): boolean {
  if (document.status === nextStatus) return true;
  return (
    TRANSITIONS[`${document.domain}:${document.kind}:${document.status}`]?.includes(
      nextStatus,
    ) ?? false
  );
}

export function verticalDocumentTotals(items: VerticalDocumentItemInput[]): {
  amount: number;
  cost: number;
} {
  const amount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  return {
    amount: Math.round(amount * 100) / 100,
    cost: Math.round(cost * 100) / 100,
  };
}

export const CLOSED_VERTICAL_STATUSES = new Set([
  "cancelled",
  "completed",
  "delivered",
  "rejected",
  "expired",
  "accepted",
  "received",
  "closed",
  "not_covered",
]);
