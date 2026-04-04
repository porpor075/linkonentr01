import { prisma } from '../lib/prisma';

export class BusinessHub {
  static async getInsurers() {
    if (!prisma) return [];
    const data = await prisma.insurer.findMany();
    return data.map(i => ({
      ...i,
      lastStatus: i.lastStatus || 'unknown',
      lastStatusMsg: i.lastStatusMsg || '',
      lastChecked: i.lastChecked || ''
    }));
  }
  
  static async getProducts(insurerId?: number) {
    if (!prisma) return [];
    const where = insurerId ? { insurerId } : {};
    const dbProducts = await prisma.insurancePlan.findMany({ where });
    
    // Map DB fields back to the expected structure in the rates API
    return dbProducts.map(p => ({
      id: p.id,
      insurerId: p.insurerId,
      planName: p.planName,
      planCode: p.planCode,
      planType: p.planType,
      repairType: p.repairType,
      basePremium: Number(p.basePremium),
      totalPremium: Number(p.totalPremium),
      isActive: p.isActive,
      isApiManaged: true // Default for compatibility
    }));
  }
}
