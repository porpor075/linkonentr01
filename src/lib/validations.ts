import { z } from 'zod';

export const InsurerSchema = z.object({
  id: z.number(),
  nameTh: z.string(),
  nameEn: z.string(),
  logoUrl: z.string().nullable().optional(),
  integrationType: z.enum(['API', 'MANUAL']),
  apiEndpoint: z.string().nullable().optional(),
  lastStatus: z.string().nullable().optional(),
  lastStatusMsg: z.string().nullable().optional(),
  lastChecked: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  insurerId: z.number(),
  planName: z.string(),
  planCode: z.string(),
  planType: z.string(),
  repairType: z.enum(['DEALER', 'COMPANY', 'UNSPECIFIED']),
  basePremium: z.number(),
  totalPremium: z.number(),
  isActive: z.boolean().default(true),
  isApiManaged: z.boolean().default(false),
});

export type Insurer = z.infer<typeof InsurerSchema>;
export type Product = z.infer<typeof ProductSchema>;
