import { z } from "zod";

import { MAX_MONEY, MAX_QUANTITY } from "./common";

export const PublishedVerticalDomain = z.enum(["revenda", "oficina", "obra"]);
export type PublishedVerticalDomain = z.infer<typeof PublishedVerticalDomain>;

export const VerticalDocumentKind = z.enum([
  "import_purchase",
  "inventory_lot",
  "wholesale_table",
  "return_case",
  "warranty_case",
  "service_order",
  "inspection",
  "quote",
  "maintenance_plan",
  "estimate",
  "project",
  "stage",
  "daily_log",
  "measurement",
  "change_order",
  "handover",
]);
export type VerticalDocumentKind = z.infer<typeof VerticalDocumentKind>;

export const VerticalDocumentItemInputDto = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(100).optional(),
  quantity: z.number().positive().max(MAX_QUANTITY).default(1),
  unit: z.string().trim().min(1).max(20).default("un"),
  unitCost: z.number().min(0).max(MAX_MONEY).default(0),
  unitPrice: z.number().min(0).max(MAX_MONEY).default(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type VerticalDocumentItemInput = z.infer<
  typeof VerticalDocumentItemInputDto
>;

const money = z.number().min(0).max(MAX_MONEY);
const shortText = z.string().trim().max(200);
const notes = z.string().trim().max(4000);
const photoList = z.array(z.string().url()).max(30).default([]);

const ResalePayloads = {
  import_purchase: z.object({
    currency: z.string().trim().min(3).max(3),
    exchangeRate: z.number().positive().max(1_000_000),
    freight: money.default(0),
    insurance: money.default(0),
    taxes: money.default(0),
    fees: money.default(0),
    supplierId: z.string().uuid().optional(),
    originCountry: z.string().trim().max(80).optional(),
  }),
  inventory_lot: z.object({
    origin: shortText,
    receivedAt: z.string().datetime().optional(),
    serialTracked: z.boolean().default(false),
    landedCost: money,
  }),
  wholesale_table: z.object({
    minimumQuantity: z.number().positive().max(MAX_QUANTITY),
    discountPercent: z.number().min(0).max(100).default(0),
    clientSegment: shortText,
  }),
  return_case: z.object({
    saleId: z.string().uuid().optional(),
    serial: shortText.optional(),
    reason: notes,
    resolution: z.enum(["refund", "exchange", "store_credit", "repair"]),
  }),
  warranty_case: z.object({
    saleId: z.string().uuid().optional(),
    serial: shortText.optional(),
    issue: notes,
    coverageUntil: z.string().datetime().optional(),
    resolution: notes.optional(),
  }),
} as const;

const WorkshopPayloads = {
  service_order: z.object({
    assetId: z.string().uuid(),
    reportedIssue: notes,
    diagnosis: notes.optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    technician: shortText.optional(),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
    accessories: z.array(shortText).max(50).default([]),
    photos: photoList,
  }),
  inspection: z.object({
    assetId: z.string().uuid(),
    checklist: z.array(shortText).min(1).max(100),
    damages: z.array(shortText).max(100).default([]),
    photos: photoList,
    acceptedAt: z.string().datetime().optional(),
  }),
  quote: z.object({
    serviceOrderId: z.string().uuid(),
    validityDays: z.number().int().min(1).max(365).default(15),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
    approvedAt: z.string().datetime().optional(),
  }),
  warranty_case: z.object({
    serviceOrderId: z.string().uuid(),
    issue: notes,
    coverageUntil: z.string().datetime().optional(),
    covered: z.boolean().default(false),
    resolution: notes.optional(),
  }),
  maintenance_plan: z
    .object({
      assetId: z.string().uuid(),
      intervalDays: z.number().int().positive().max(3650).optional(),
      intervalKm: z.number().positive().max(10_000_000).optional(),
      nextDueAt: z.string().datetime().optional(),
      nextDueKm: z.number().min(0).max(10_000_000).optional(),
    })
    .refine((value) => value.intervalDays || value.intervalKm, {
      message: "Informe intervalo por dias ou quilometragem",
    }),
} as const;

const ConstructionPayloads = {
  estimate: z.object({
    address: notes,
    validUntil: z.string().datetime().optional(),
    overheadPercent: z.number().min(0).max(500).default(0),
    profitPercent: z.number().min(0).max(500).default(0),
    exclusions: z.array(shortText).max(100).default([]),
  }),
  project: z.object({
    address: notes,
    manager: shortText.optional(),
    baselineVersion: z.number().int().positive().default(1),
    contractAcceptedAt: z.string().datetime().optional(),
  }),
  stage: z.object({
    projectId: z.string().uuid(),
    plannedStart: z.string().datetime(),
    plannedEnd: z.string().datetime(),
    dependencies: z.array(z.string().uuid()).max(100).default([]),
    assignedTo: shortText.optional(),
  }),
  daily_log: z.object({
    projectId: z.string().uuid(),
    date: z.string().date(),
    weather: shortText.optional(),
    teamCount: z.number().int().min(0).max(1000),
    activities: z.array(shortText).min(1).max(100),
    occurrences: z.array(shortText).max(100).default([]),
    photos: photoList,
  }),
  measurement: z
    .object({
      projectId: z.string().uuid(),
      stageId: z.string().uuid().optional(),
      measuredQuantity: z.number().positive().max(MAX_QUANTITY),
      contractedQuantity: z.number().positive().max(MAX_QUANTITY),
      retentionPercent: z.number().min(0).max(100).default(0),
      approvalStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
    })
    .refine((value) => value.measuredQuantity <= value.contractedQuantity, {
      message: "A medição não pode superar a quantidade contratada",
    }),
  change_order: z.object({
    projectId: z.string().uuid(),
    reason: notes,
    daysImpact: z.number().int().min(-3650).max(3650).default(0),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
  }),
  handover: z.object({
    projectId: z.string().uuid(),
    pendingItems: z.array(shortText).max(200).default([]),
    acceptedAt: z.string().datetime().optional(),
    warrantyUntil: z.string().datetime().optional(),
  }),
} as const;

type PayloadSchema = z.ZodType<Record<string, unknown>>;
const PAYLOAD_SCHEMAS: Record<
  PublishedVerticalDomain,
  Partial<Record<VerticalDocumentKind, PayloadSchema>>
> = {
  revenda: ResalePayloads,
  oficina: WorkshopPayloads,
  obra: ConstructionPayloads,
};

export function parseVerticalPayload(
  domain: PublishedVerticalDomain,
  kind: VerticalDocumentKind,
  payload: unknown,
): Record<string, unknown> {
  const schema = PAYLOAD_SCHEMAS[domain][kind];
  if (!schema) throw new Error(`Documento ${kind} não pertence ao domínio ${domain}`);
  return schema.parse(payload);
}

export const VerticalKindsByDomain: Record<
  PublishedVerticalDomain,
  readonly VerticalDocumentKind[]
> = {
  revenda: [
    "import_purchase",
    "inventory_lot",
    "wholesale_table",
    "return_case",
    "warranty_case",
  ],
  oficina: [
    "service_order",
    "inspection",
    "quote",
    "warranty_case",
    "maintenance_plan",
  ],
  obra: [
    "estimate",
    "project",
    "stage",
    "daily_log",
    "measurement",
    "change_order",
    "handover",
  ],
};

export const CreateVerticalDocumentDto = z
  .object({
    domain: PublishedVerticalDomain,
    kind: VerticalDocumentKind,
    title: z.string().trim().min(1).max(200),
    clientId: z.string().uuid().optional(),
    parentId: z.string().uuid().optional(),
    amount: money.default(0),
    cost: money.default(0),
    progress: z.number().min(0).max(100).default(0),
    startsAt: z.string().datetime().optional(),
    dueAt: z.string().datetime().optional(),
    payload: z.record(z.string(), z.unknown()),
    items: z.array(VerticalDocumentItemInputDto).max(1000).default([]),
  })
  .superRefine((value, context) => {
    try {
      parseVerticalPayload(value.domain, value.kind, value.payload);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payload"],
        message: error instanceof Error ? error.message : "Payload inválido",
      });
    }
  });
export type CreateVerticalDocument = z.infer<typeof CreateVerticalDocumentDto>;

export const UpdateVerticalDocumentDto = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  amount: money.optional(),
  cost: money.optional(),
  progress: z.number().min(0).max(100).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  items: z.array(VerticalDocumentItemInputDto).max(1000).optional(),
  expectedVersion: z.number().int().positive(),
});
export type UpdateVerticalDocument = z.infer<typeof UpdateVerticalDocumentDto>;

export const TransitionVerticalDocumentDto = z.object({
  status: z.string().trim().min(1).max(60),
  idempotencyKey: z.string().trim().min(8).max(120),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const VerticalDocumentItemDto = VerticalDocumentItemInputDto.extend({
  id: z.string().uuid(),
  productId: z.string().uuid().nullable(),
});

export const VerticalEventDto = z.object({
  id: z.string().uuid(),
  type: z.string(),
  fromStatus: z.string().nullable(),
  toStatus: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

export const VerticalDocumentDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  domain: PublishedVerticalDomain,
  kind: VerticalDocumentKind,
  status: z.string(),
  title: z.string(),
  clientId: z.string().uuid().nullable(),
  parentId: z.string().uuid().nullable(),
  amount: z.number(),
  cost: z.number(),
  progress: z.number(),
  startsAt: z.string().datetime().nullable(),
  dueAt: z.string().datetime().nullable(),
  payload: z.record(z.string(), z.unknown()),
  version: z.number().int(),
  items: z.array(VerticalDocumentItemDto),
  events: z.array(VerticalEventDto),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VerticalDocument = z.infer<typeof VerticalDocumentDto>;

export const CreateVerticalAssetDto = z.object({
  domain: z.literal("oficina"),
  clientId: z.string().uuid().optional(),
  kind: z.enum(["vehicle", "phone", "computer", "appliance", "machine", "other"]),
  name: z.string().trim().min(1).max(200),
  identifier: z.string().trim().max(120).optional(),
  payload: z.object({
    brand: shortText.optional(),
    model: shortText.optional(),
    year: z.number().int().min(1900).max(2200).optional(),
    mileage: z.number().min(0).max(10_000_000).optional(),
    notes: notes.optional(),
  }),
});
export type CreateVerticalAsset = z.infer<typeof CreateVerticalAssetDto>;

export const VerticalAssetDto = CreateVerticalAssetDto.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clientId: z.string().uuid().nullable(),
  identifier: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VerticalAsset = z.infer<typeof VerticalAssetDto>;

export const CreateResaleSerialDto = z.object({
  productId: z.string().uuid(),
  variationId: z.string().uuid().optional(),
  serial: z.string().trim().min(3).max(160),
  lotDocumentId: z.string().uuid().optional(),
  cost: money.default(0),
  warrantyUntil: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateResaleSerial = z.infer<typeof CreateResaleSerialDto>;
export const UpdateResaleSerialStatusDto = z.object({
  status: z.enum(["available", "reserved", "sold", "returned", "warranty"]),
  saleId: z.string().uuid().optional(),
  expectedStatus: z.enum(["available", "reserved", "sold", "returned", "warranty"]),
});

export const ResaleSerialDto = CreateResaleSerialDto.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  variationId: z.string().uuid().nullable(),
  lotDocumentId: z.string().uuid().nullable(),
  saleId: z.string().uuid().nullable(),
  status: z.enum(["available", "reserved", "sold", "returned", "warranty"]),
  warrantyUntil: z.string().datetime().nullable(),
  soldAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ResaleSerial = z.infer<typeof ResaleSerialDto>;

export const AppMembershipDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  brandId: z.string(),
  domain: PublishedVerticalDomain,
  status: z.enum(["active", "paused"]),
  onboardedAt: z.string().datetime().nullable(),
  lastOpenedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
export type AppMembership = z.infer<typeof AppMembershipDto>;

export const VerticalDashboardDto = z.object({
  domain: PublishedVerticalDomain,
  totalDocuments: z.number().int(),
  openDocuments: z.number().int(),
  dueDocuments: z.number().int(),
  amount: z.number(),
  cost: z.number(),
  projectedProfit: z.number(),
  byKind: z.record(z.string(), z.number().int()),
  byStatus: z.record(z.string(), z.number().int()),
});
export type VerticalDashboard = z.infer<typeof VerticalDashboardDto>;
