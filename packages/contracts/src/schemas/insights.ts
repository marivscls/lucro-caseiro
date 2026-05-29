import { z } from "zod";

export const TopProductDto = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  quantity: z.number(),
  revenue: z.number(),
});

export type TopProduct = z.infer<typeof TopProductDto>;

export const TopClientDto = z.object({
  clientId: z.string().uuid(),
  name: z.string(),
  totalSpent: z.number(),
  salesCount: z.number(),
});

export type TopClient = z.infer<typeof TopClientDto>;

export const MonthlyRevenueDto = z.object({
  month: z.string(), // YYYY-MM
  revenue: z.number(),
  salesCount: z.number(),
});

export type MonthlyRevenue = z.infer<typeof MonthlyRevenueDto>;

export const InsightsDto = z.object({
  months: z.number(),
  totalRevenue: z.number(),
  totalSales: z.number(),
  topProducts: z.array(TopProductDto),
  topClients: z.array(TopClientDto),
  monthlyRevenue: z.array(MonthlyRevenueDto),
});

export type Insights = z.infer<typeof InsightsDto>;
