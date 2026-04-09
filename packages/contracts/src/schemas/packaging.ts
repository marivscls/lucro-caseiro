import { z } from "zod";
import { PackagingType } from "./common";

export const CreatePackagingDto = z.object({
  name: z.string().min(1).max(200),
  type: PackagingType,
  unitCost: z.number().positive(),
  supplier: z.string().max(200).optional(),
  photoUrl: z.string().url().optional(),
});

export type CreatePackaging = z.infer<typeof CreatePackagingDto>;

export const UpdatePackagingDto = CreatePackagingDto.partial();
export type UpdatePackaging = z.infer<typeof UpdatePackagingDto>;

export const PackagingDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  type: PackagingType,
  unitCost: z.number(),
  supplier: z.string().nullable(),
  photoUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Packaging = z.infer<typeof PackagingDto>;
