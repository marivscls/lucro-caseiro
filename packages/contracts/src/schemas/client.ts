import { z } from "zod";

export const CreateClientDto = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(8).max(20).optional(),
  address: z.string().max(500).optional(),
  birthday: z.string().date().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateClient = z.infer<typeof CreateClientDto>;

export const UpdateClientDto = CreateClientDto.partial();
export type UpdateClient = z.infer<typeof UpdateClientDto>;

export const ClientDto = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  birthday: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  totalSpent: z.number(),
  createdAt: z.string().datetime(),
});

export type Client = z.infer<typeof ClientDto>;
