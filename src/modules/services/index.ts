import { prisma } from '@/lib/prisma';
import { Insurer, InsurerSchema, Product, ProductSchema } from '@/lib/validations';

export class ProductStoreService {
  static async getInsurers(): Promise<Insurer[]> {
    if (!prisma) return [];
    const data = await prisma.insurer.findMany();
    return data.map((item: any) => InsurerSchema.parse({
      ...item,
      createdAt: item.createdAt.toISOString()
    }));
  }

  static async saveInsurers(insurers: Insurer[]): Promise<void> {
    if (!prisma) return;
    for (const i of insurers) {
      await prisma.insurer.upsert({
        where: { id: i.id },
        update: {
          nameTh: i.nameTh,
          nameEn: i.nameEn,
          logoUrl: i.logoUrl,
          integrationType: i.integrationType,
          apiEndpoint: i.apiEndpoint
        },
        create: {
          id: i.id,
          nameTh: i.nameTh,
          nameEn: i.nameEn,
          logoUrl: i.logoUrl,
          integrationType: i.integrationType,
          apiEndpoint: i.apiEndpoint
        }
      });
    }
  }

  static async getProducts(insurerId?: number): Promise<Product[]> {
    if (!prisma) return [];
    const where = insurerId ? { insurerId } : {};
    const data = await prisma.insurancePlan.findMany({ where });
    
    return data.map((item: any) => ProductSchema.parse({
      id: item.id,
      insurerId: item.insurerId,
      planName: item.planName,
      planCode: item.planCode,
      planType: item.planType,
      repairType: item.repairType,
      basePremium: Number(item.basePremium),
      totalPremium: Number(item.totalPremium),
      isActive: item.isActive,
      isApiManaged: true
    }));
  }

  static async saveProducts(products: Product[]): Promise<void> {
    if (!prisma) return;
    for (const p of products) {
      await prisma.insurancePlan.upsert({
        where: { id: String(p.id) },
        update: {
          planName: p.planName,
          planCode: p.planCode,
          planType: p.planType,
          repairType: p.repairType,
          basePremium: p.basePremium,
          totalPremium: p.totalPremium,
          isActive: p.isActive
        },
        create: {
          id: String(p.id),
          insurerId: p.insurerId,
          planName: p.planName,
          planCode: p.planCode,
          planType: p.planType,
          repairType: p.repairType,
          basePremium: p.basePremium,
          totalPremium: p.totalPremium,
          isActive: p.isActive
        }
      });
    }
  }
}
