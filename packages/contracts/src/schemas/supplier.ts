import { z } from "zod";

export const SupplierCategoryDto = z.enum(["supplies", "packaging", "food", "other"]);
export type SupplierCategory = z.infer<typeof SupplierCategoryDto>;

export const SupplierAvatarTypeDto = z.enum(["preset", "upload", "initials"]);
export type SupplierAvatarType = z.infer<typeof SupplierAvatarTypeDto>;

const SupplierNameDto = z.string().trim().min(2).max(200);
const SupplierPhoneDto = z
  .string()
  .trim()
  .refine((phone) => {
    const digits = phone.replace(/\D/g, "");
    return (
      digits.length === 10 ||
      digits.length === 11 ||
      ((digits.length === 12 || digits.length === 13) && digits.startsWith("55"))
    );
  }, "Telefone brasileiro inválido");
const SupplierEmailDto = z.string().trim().email().max(200);
const SupplierImageUrlDto = z
  .string()
  .url()
  .max(2000)
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    "URL de imagem inválida",
  );

export const CreateSupplierDto = z.object({
  name: SupplierNameDto,
  category: SupplierCategoryDto,
  phone: SupplierPhoneDto.nullable().optional(),
  hasWhatsApp: z.boolean().default(false),
  email: SupplierEmailDto.nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  purchaseDescription: z.string().trim().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isPreferred: z.boolean().default(false),
  avatarType: SupplierAvatarTypeDto.default("initials"),
  avatarPresetId: z.string().max(100).nullable().optional(),
  avatarUrl: SupplierImageUrlDto.nullable().optional(),
  needsFollowUp: z.boolean().default(false),
  restockSoon: z.boolean().default(false),
});

export type CreateSupplier = z.infer<typeof CreateSupplierDto>;

export const UpdateSupplierDto = z.object({
  name: SupplierNameDto.optional(),
  category: SupplierCategoryDto.optional(),
  phone: SupplierPhoneDto.nullable().optional(),
  hasWhatsApp: z.boolean().optional(),
  email: SupplierEmailDto.nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  purchaseDescription: z.string().trim().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isPreferred: z.boolean().optional(),
  avatarType: SupplierAvatarTypeDto.optional(),
  avatarPresetId: z.string().max(100).nullable().optional(),
  avatarUrl: SupplierImageUrlDto.nullable().optional(),
  needsFollowUp: z.boolean().optional(),
  restockSoon: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSupplier = z.infer<typeof UpdateSupplierDto>;

export const SupplierDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  category: SupplierCategoryDto,
  phone: z.string().nullable(),
  hasWhatsApp: z.boolean(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  purchaseDescription: z.string().nullable(),
  notes: z.string().nullable(),
  isPreferred: z.boolean(),
  avatarType: SupplierAvatarTypeDto,
  avatarPresetId: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  needsFollowUp: z.boolean(),
  restockSoon: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Supplier = z.infer<typeof SupplierDto>;

export const SupplierPurchaseSnapshotDto = z.object({
  id: z.string().uuid(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  purchasedAt: z.string(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      id: z.string().uuid(),
      productName: z.string(),
      variationId: z.string().uuid().nullable(),
      variationName: z.string().nullable(),
      quantity: z.number(),
      unitCost: z.number(),
      subtotal: z.number(),
    }),
  ),
});
export type SupplierPurchaseSnapshot = z.infer<typeof SupplierPurchaseSnapshotDto>;

export const SupplierOverviewItemDto = SupplierDto.extend({
  lastPurchase: SupplierPurchaseSnapshotDto.nullable(),
  totalPurchaseCount: z.number().int().nonnegative(),
  totalPurchaseAmount: z.number().nonnegative(),
  hasOpenOrder: z.boolean(),
});
export type SupplierOverviewItem = z.infer<typeof SupplierOverviewItemDto>;

export const SuppliersOverviewDto = z.object({
  month: z.object({
    totalAmount: z.number().nonnegative(),
    purchaseCount: z.number().int().nonnegative(),
    supplierCount: z.number().int().nonnegative(),
    planningStatus: z.literal("none"),
  }),
  items: z.array(SupplierOverviewItemDto),
});
export type SuppliersOverview = z.infer<typeof SuppliersOverviewDto>;
