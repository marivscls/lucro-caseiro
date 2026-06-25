import { z } from "zod";

export const CreateSupplierDto = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().max(200).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateSupplier = z.infer<typeof CreateSupplierDto>;

export const UpdateSupplierDto = CreateSupplierDto.partial();
export type UpdateSupplier = z.infer<typeof UpdateSupplierDto>;

export const SupplierDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Supplier = z.infer<typeof SupplierDto>;
