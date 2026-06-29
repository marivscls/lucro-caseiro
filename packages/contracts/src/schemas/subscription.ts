import { z } from "zod";
import { PlanType } from "./common";

export const UserProfileDto = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  businessName: z.string().nullable(),
  businessType: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  plan: PlanType,
  planExpiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileDto>;

export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).optional(),
  businessName: z.string().max(200).optional(),
  businessType: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type UpdateProfile = z.infer<typeof UpdateProfileDto>;

export const FreemiumLimitsDto = z.object({
  maxSalesPerMonth: z.number().nullable(),
  maxClients: z.number().nullable(),
  maxRecipes: z.number().nullable(),
  maxPackaging: z.number().nullable(),
  maxProducts: z.number().nullable(),
  maxSuppliers: z.number().nullable(),
  currentSalesThisMonth: z.number(),
  currentClients: z.number(),
  currentRecipes: z.number(),
  currentPackaging: z.number(),
  currentProducts: z.number(),
  currentSuppliers: z.number(),
});

export type FreemiumLimits = z.infer<typeof FreemiumLimitsDto>;
