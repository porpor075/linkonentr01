import { prisma } from '../lib/prisma';
import { AnalyticsHub } from '../hubs/analyticsHub';

export class QuotationEngine {
  static async recordSale(policyData: any) {
    if (!prisma) {
      console.error('Prisma not initialized, cannot record sale');
      return policyData;
    }

    const rate = await AnalyticsHub.getRate(policyData.planId, policyData.userId);
    const commAmount = (policyData.premiumAmount * rate) / 100;
    
    try {
      // 1. สร้าง หรือ ค้นหา Quotation ก่อน
      const quotation = await prisma.quotation.upsert({
        where: { id: policyData.quotationId },
        update: { status: 'completed' },
        create: {
          id: policyData.quotationId,
          userId: policyData.userId,
          customerName: policyData.quotation.customerName,
          vehicleBrand: policyData.quotation.vehicleBrand,
          vehicleModel: policyData.quotation.vehicleModel,
          vehicleYear: String(policyData.vehicle?.yearOfManufacture || '2024'),
          sumInsured: policyData.premiumAmount / 0.03, // ม็อคทุนประกันจากเบี้ย
          status: 'completed'
        }
      });

      // 2. สร้าง Policy ผูกกับ Quotation
      const newPolicy = await prisma.policy.create({
        data: {
          id: policyData.id,
          quotationId: quotation.id,
          planId: policyData.planId,
          policyNumber: policyData.policyNumber,
          status: policyData.status === 'SUCCESS' ? 'SUCCESS' : 'pending',
          premiumAmount: policyData.premiumAmount,
          commissionAmount: commAmount,
          createdAt: new Date()
        },
        include: {
          quotation: true,
          plan: {
            include: { insurer: true }
          }
        }
      });

      return newPolicy;
    } catch (error) {
      console.error('Failed to save policy to DB:', error);
      // Fallback สำหรับกรณี DB มีปัญหา เพื่อไม่ให้หน้าบ้านพัง
      return { ...policyData, commissionAmount: commAmount };
    }
  }
}
