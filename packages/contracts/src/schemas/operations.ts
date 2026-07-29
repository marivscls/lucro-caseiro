import { z } from "zod";

import { MAX_MONEY, MAX_QUANTITY } from "./common";

export const ServiceLocationMode = z.enum(["business", "client", "online", "flexible"]);
export type ServiceLocationMode = z.infer<typeof ServiceLocationMode>;

export const AppointmentLocationMode = ServiceLocationMode.exclude(["flexible"]);
export type AppointmentLocationMode = z.infer<typeof AppointmentLocationMode>;

export const ServiceAppointmentStatus = z.enum([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);
export type ServiceAppointmentStatus = z.infer<typeof ServiceAppointmentStatus>;

export const ServiceVariationInputDto = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().min(5).max(1440),
  price: z.number().positive().max(MAX_MONEY),
  active: z.boolean().optional(),
});
export type ServiceVariationInput = z.infer<typeof ServiceVariationInputDto>;

export const ServiceAddOnInputDto = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().min(0).max(1440).default(0),
  price: z.number().positive().max(MAX_MONEY),
  active: z.boolean().optional(),
});
export type ServiceAddOnInput = z.infer<typeof ServiceAddOnInputDto>;

export const ServicePackageInputDto = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  sessions: z.number().int().min(2).max(365),
  price: z.number().positive().max(MAX_MONEY),
  validityDays: z.number().int().min(1).max(3650),
  recurrenceDays: z.number().int().min(1).max(365).nullable().optional(),
  active: z.boolean().optional(),
});
export type ServicePackageInput = z.infer<typeof ServicePackageInputDto>;

export const StockMovementType = z.enum([
  "sale",
  "purchase",
  "adjustment",
  "cancellation",
  "production",
]);
export type StockMovementType = z.infer<typeof StockMovementType>;

export const CreateStockAdjustmentDto = z.object({
  variationId: z.string().uuid().nullable().optional(),
  delta: z
    .number()
    .int()
    .min(-MAX_QUANTITY)
    .max(MAX_QUANTITY)
    .refine((v) => v !== 0, {
      message: "A quantidade do ajuste deve ser diferente de zero",
    }),
  reason: z.string().max(200).nullable().optional(),
  occurredAt: z.string().datetime().optional(),
});
export type CreateStockAdjustment = z.infer<typeof CreateStockAdjustmentDto>;

export const StockMovementDto = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  variationId: z.string().uuid().nullable(),
  type: StockMovementType,
  delta: z.number(),
  balanceAfter: z.number().nullable(),
  reason: z.string().nullable(),
  sourceId: z.string().uuid().nullable(),
  occurredAt: z.string().datetime(),
});
export type StockMovement = z.infer<typeof StockMovementDto>;

export const CreateServiceDto = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  durationMinutes: z.number().int().min(5).max(1440),
  defaultPrice: z.number().positive().max(MAX_MONEY).nullable().optional(),
  materialCost: z.number().min(0).max(MAX_MONEY).optional(),
  hourlyRate: z.number().min(0).max(MAX_MONEY).optional(),
  otherCost: z.number().min(0).max(MAX_MONEY).optional(),
  fixedCostShare: z.number().min(0).max(MAX_MONEY).optional(),
  markupPercent: z.number().min(0).max(1000).optional(),
  feesPercent: z.number().min(0).max(95).optional(),
  locationMode: ServiceLocationMode.optional(),
  bufferMinutes: z.number().int().min(0).max(1440).optional(),
  publicEnabled: z.boolean().optional(),
  bookingInstructions: z.string().trim().max(500).nullable().optional(),
  variations: z.array(ServiceVariationInputDto).max(30).optional(),
  addOns: z.array(ServiceAddOnInputDto).max(50).optional(),
  packages: z.array(ServicePackageInputDto).max(30).optional(),
  active: z.boolean().optional(),
});
export type CreateService = z.infer<typeof CreateServiceDto>;
export const UpdateServiceDto = CreateServiceDto.partial();
export type UpdateService = z.infer<typeof UpdateServiceDto>;

export const ServiceDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number().int(),
  defaultPrice: z.number().nullable(),
  materialCost: z.number(),
  hourlyRate: z.number(),
  otherCost: z.number(),
  fixedCostShare: z.number(),
  markupPercent: z.number(),
  feesPercent: z.number(),
  locationMode: ServiceLocationMode,
  bufferMinutes: z.number().int(),
  publicEnabled: z.boolean(),
  bookingInstructions: z.string().nullable(),
  active: z.boolean(),
  variations: z.array(
    ServiceVariationInputDto.extend({
      id: z.string().uuid(),
      active: z.boolean(),
    }),
  ),
  addOns: z.array(
    ServiceAddOnInputDto.extend({
      id: z.string().uuid(),
      active: z.boolean(),
    }),
  ),
  packages: z.array(
    ServicePackageInputDto.extend({
      id: z.string().uuid(),
      active: z.boolean(),
    }),
  ),
  createdAt: z.string().datetime(),
});
export type Service = z.infer<typeof ServiceDto>;

export const PurchaseServicePackageDto = z.object({
  clientId: z.string().uuid(),
  paymentMethod: z.enum(["pix", "cash", "card", "credit", "transfer"]),
  pricePaid: z.number().positive().max(MAX_MONEY).optional(),
  purchasedAt: z.string().datetime().optional(),
});
export type PurchaseServicePackage = z.infer<typeof PurchaseServicePackageDto>;

export const ServicePackagePurchaseDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  packageId: z.string().uuid(),
  packageName: z.string(),
  serviceId: z.string().uuid(),
  serviceName: z.string(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  sessionsTotal: z.number().int(),
  sessionsUsed: z.number().int(),
  pricePaid: z.number(),
  purchasedAt: z.string().datetime(),
  expiresAt: z.string().date(),
  status: z.enum(["active", "completed", "expired", "cancelled"]),
  saleId: z.string().uuid().nullable(),
});
export type ServicePackagePurchase = z.infer<typeof ServicePackagePurchaseDto>;

export const ServiceBookingRequestStatus = z.enum([
  "new",
  "contacted",
  "confirmed",
  "declined",
]);
export type ServiceBookingRequestStatus = z.infer<typeof ServiceBookingRequestStatus>;

export const PublicServiceBookingRequestInputDto = z.object({
  serviceId: z.string().uuid(),
  clientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  desiredDate: z.string().date(),
  desiredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  locationMode: AppointmentLocationMode,
  notes: z.string().trim().max(500).nullable().optional(),
});
export type PublicServiceBookingRequestInput = z.infer<
  typeof PublicServiceBookingRequestInputDto
>;

export const ServiceBookingRequestDto = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  serviceName: z.string(),
  clientName: z.string(),
  phone: z.string(),
  desiredDate: z.string().date(),
  desiredTime: z.string().nullable(),
  locationMode: AppointmentLocationMode,
  notes: z.string().nullable(),
  status: ServiceBookingRequestStatus,
  createdAt: z.string().datetime(),
});
export type ServiceBookingRequest = z.infer<typeof ServiceBookingRequestDto>;

export const UpdateServiceBookingRequestDto = z.object({
  status: ServiceBookingRequestStatus,
});
export type UpdateServiceBookingRequest = z.infer<typeof UpdateServiceBookingRequestDto>;

export const ServiceInsightClientDto = z.object({
  clientId: z.string().uuid().nullable(),
  clientName: z.string(),
  appointments: z.number().int(),
  revenue: z.number(),
});

export const ServiceInsightsDto = z.object({
  serviceId: z.string().uuid(),
  totalAppointments: z.number().int(),
  completedAppointments: z.number().int(),
  cancelledAppointments: z.number().int(),
  noShowAppointments: z.number().int(),
  revenue: z.number(),
  cost: z.number(),
  profit: z.number(),
  averageTicket: z.number(),
  totalHours: z.number(),
  profitPerHour: z.number(),
  topClients: z.array(ServiceInsightClientDto),
  recentAppointments: z.array(
    z.object({
      id: z.string().uuid(),
      clientName: z.string(),
      deliveryDate: z.string().date(),
      deliveryTime: z.string().nullable(),
      appointmentStatus: ServiceAppointmentStatus,
      amount: z.number(),
      actualCost: z.number(),
    }),
  ),
  packagePurchases: z.array(ServicePackagePurchaseDto),
  bookingRequests: z.array(ServiceBookingRequestDto),
});
export type ServiceInsights = z.infer<typeof ServiceInsightsDto>;

export const ProductionRunStatus = z.enum(["draft", "closed"]);
export type ProductionRunStatus = z.infer<typeof ProductionRunStatus>;

export const ProductionRunMaterialInputDto = z.object({
  materialId: z.string().uuid(),
  plannedQuantity: z.number().min(0).max(MAX_QUANTITY),
  actualQuantity: z.number().min(0).max(MAX_QUANTITY),
  wasteQuantity: z.number().min(0).max(MAX_QUANTITY).default(0),
  unitCost: z.number().min(0).max(MAX_MONEY),
});
export type ProductionRunMaterialInput = z.infer<typeof ProductionRunMaterialInputDto>;

export const CreateProductionRunDto = z.object({
  productId: z.string().uuid().nullable().optional(),
  recipeId: z.string().uuid().nullable().optional(),
  plannedQuantity: z.number().positive().max(MAX_QUANTITY),
  producedQuantity: z.number().min(0).max(MAX_QUANTITY),
  notes: z.string().max(500).nullable().optional(),
  materials: z.array(ProductionRunMaterialInputDto).min(1).max(200),
});
export type CreateProductionRun = z.infer<typeof CreateProductionRunDto>;

export const ProductionRunDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  recipeId: z.string().uuid().nullable(),
  plannedQuantity: z.number(),
  producedQuantity: z.number(),
  plannedCost: z.number(),
  actualCost: z.number(),
  wasteCost: z.number(),
  status: ProductionRunStatus,
  notes: z.string().nullable(),
  materials: z.array(
    ProductionRunMaterialInputDto.extend({
      id: z.string().uuid(),
      materialName: z.string(),
    }),
  ),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
});
export type ProductionRun = z.infer<typeof ProductionRunDto>;
